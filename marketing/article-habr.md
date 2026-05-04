# Как мы построили email-платформу на Cloud Functions, PostgreSQL и polza.ai: разбор архитектуры MAIL-KA

> **Хабы**: Разработка веб-сайтов, Облачные сервисы, Python, PostgreSQL, Машинное обучение, API, Email, Маркетинг
>
> **Уровень**: Средний

В статье разберу архитектуру российской платформы email-маркетинга **MAIL-KA**: как мы собрали SaaS на serverless-функциях, какие выбрали технологии для отправки 100+ тыс. писем в час, как прикрутили GPT-4o и Claude через рублёвый шлюз polza.ai, и почему не стали использовать Kubernetes.

---

## Стек: что и почему

| Слой | Технология | Почему |
|------|------------|--------|
| Frontend | Vite + React 18 + TypeScript + Tailwind | Быстрая сборка, тонкий бандл, типобезопасность |
| Backend | Python 3.11 Cloud Functions | Скейлится автоматически, плата за вызовы |
| База данных | PostgreSQL + psycopg2 (Simple Query Protocol) | Надёжность, JSONB, full-text search |
| Очередь рассылок | PostgreSQL FOR UPDATE SKIP LOCKED | Не нужен RabbitMQ для 100 RPS |
| ИИ | polza.ai (OpenAI-совместимый API) | GPT-4o, Claude, DeepSeek в рублях без VPN |
| SMTP | Свой relay + SPF/DKIM/DMARC | Контроль доставляемости |
| Файлы | S3-совместимое хранилище + CDN | Изображения в письмах |
| Аутентификация | JWT (HMAC-SHA256), email-код | Без паролей, без OAuth-зоопарка |

Главная идея: **никакого Kubernetes, никакого Docker в проде**. Cloud Functions сами скейлятся под нагрузку, мы платим только за реальные вызовы. Для команды из 3 человек это экономит сотни часов на DevOps.

---

## Архитектура отправки писем

### Проблема

Когда маркетолог запускает рассылку на 50 000 контактов, нужно:

1. Отправить 50 000 писем за разумное время (≤30 минут);
2. Не упереться в rate limit SMTP-провайдера;
3. Распределить нагрузку между несколькими IP для прогрева;
4. Перехватывать bounce'ы, отписки и жалобы;
5. Уметь паузить и возобновлять кампанию.

### Решение: PostgreSQL как очередь

Создаём таблицу `email_queue`:

```sql
CREATE TABLE email_queue (
    id BIGSERIAL PRIMARY KEY,
    campaign_id BIGINT NOT NULL,
    contact_id BIGINT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    scheduled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    locked_until TIMESTAMPTZ,
    attempts SMALLINT NOT NULL DEFAULT 0,
    last_error TEXT,
    sent_at TIMESTAMPTZ
);

CREATE INDEX idx_queue_pending
    ON email_queue (scheduled_at)
    WHERE status = 'pending';
```

Воркер забирает батч писем атомарно через `FOR UPDATE SKIP LOCKED`:

```python
def fetch_batch(conn, batch_size: int = 50) -> list[dict]:
    cur = conn.cursor()
    cur.execute("""
        WITH picked AS (
            SELECT id FROM email_queue
            WHERE status = 'pending'
              AND scheduled_at <= NOW()
              AND (locked_until IS NULL OR locked_until < NOW())
            ORDER BY scheduled_at
            FOR UPDATE SKIP LOCKED
            LIMIT %s
        )
        UPDATE email_queue q
        SET status = 'sending',
            locked_until = NOW() + INTERVAL '5 minutes',
            attempts = attempts + 1
        FROM picked
        WHERE q.id = picked.id
        RETURNING q.*
    """, (batch_size,))
    return cur.fetchall()
```

`SKIP LOCKED` позволяет нескольким воркерам тащить из очереди параллельно без блокировок — каждый получает свой кусок. PostgreSQL держит до 200 RPS на наших нагрузках без потных оптимизаций.

### Прогрев домена

Новый домен начинает с 50 писем в сутки и удваивает лимит каждые 24 часа (если open rate > 15% и spam-rate < 0.1%):

```python
def daily_limit(domain_age_days: int) -> int:
    if domain_age_days < 1: return 50
    if domain_age_days < 3: return 100
    if domain_age_days < 7: return 500
    if domain_age_days < 14: return 2000
    if domain_age_days < 30: return 10000
    return 100000
```

---

## ИИ-копирайтер на GPT-4o через polza.ai

Для российских пользователей платить OpenAI напрямую — боль (карты, VPN, лимиты). Решили через **polza.ai** — это OpenAI-совместимый шлюз с оплатой в рублях, доступом к 400+ моделям (GPT-4o, Claude 3.5, DeepSeek, Llama).

Backend-функция:

```python
import json, os, urllib.request

POLZA_URL = "https://api.polza.ai/api/v1/chat/completions"

def call_llm(messages: list, model: str = "openai/gpt-4o-mini",
             temperature: float = 0.8, json_mode: bool = False) -> dict:
    payload = {
        "model": model,
        "messages": messages,
        "temperature": temperature,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    req = urllib.request.Request(
        POLZA_URL,
        data=json.dumps(payload).encode("utf-8"),
        method="POST",
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {os.environ['POLZA_AI_API_KEY']}",
        },
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        result = json.loads(r.read().decode())
    return {"text": result["choices"][0]["message"]["content"]}
```

Фишка — заставляем модель отвечать **строго JSON** через `response_format: json_object`. Это убирает регулярки и парсинг текстовых ответов.

### Промпт для генерации письма

```python
system = (
    "Ты — топовый российский email-копирайтер. "
    "Пишешь продающие письма на русском языке. "
    "Используй переменные {{first_name}}. "
    "Структура: цепляющая тема, прехедер, тело письма, CTA. "
    "Тон — живой, без канцелярита, без спам-слов. "
    "Длина тела — 80-150 слов, абзацы по 1-2 предложения. "
    "Отвечай в JSON: {subject, preheader, body, cta_text}"
)
```

Качество — на уровне человека-копирайтера среднего звена. Стоимость одного письма — 0.05–0.30 ₽ в зависимости от модели.

### Predictive AI: open rate prediction

Тут не нужен ML-стек — достаточно LLM с правильным промптом:

```python
system = (
    "Ты — аналитик email-маркетинга. "
    "Оцениваешь, насколько хороша тема письма для open rate. "
    "Учитываешь: длину, эмоцию, интригу, персонализацию, спам-факторы. "
    "Отвечай в JSON: {predicted_open_rate: 5-60, "
    "rating: плохо/средне/хорошо/отлично, "
    "reason: краткое объяснение, "
    "improvements: [3 совета]}"
)
```

Точность на нашей тестовой выборке (200 писем): MAE ≈ 4.8% — для маркетинга более чем достаточно.

---

## Антифрод: защита от спам-ботов и абьюза

### Rate limiting в backend

```python
def check_rate_limit(conn, user_id: int, action: str, limit: int, window_sec: int) -> bool:
    cur = conn.cursor()
    cur.execute("""
        SELECT COUNT(*) FROM rate_limits
        WHERE user_id = %s AND action = %s
          AND created_at > NOW() - INTERVAL '%s seconds'
    """, (user_id, action, window_sec))
    count = cur.fetchone()[0]
    if count >= limit:
        return False
    cur.execute(
        "INSERT INTO rate_limits (user_id, action) VALUES (%s, %s)",
        (user_id, action),
    )
    conn.commit()
    return True
```

### Аудит входов

Каждое событие аутентификации пишется в `auth_audit`: IP, user-agent, успех/провал, причина блокировки. Если 5 неудачных попыток за 10 минут — IP блокируется на час, аккаунт — на 30 минут.

### CAPTCHA только при подозрении

CAPTCHA не показываем всем подряд (это убивает конверсию регистрации). Включаем только при:

- более 3 регистраций с одного IP за час;
- временный email (10minutemail, mailinator);
- браузер без cookies или с известным fingerprint бота.

---

## Что не получилось с первого раза

1. **Pgbouncer + Cloud Functions** — конфликт пулинга соединений. Ушли на `psycopg2.connect()` per-request с тайм-аутом 5 секунд. Дороже по соединениям, но надёжнее.

2. **Asyncpg** — не работает с Simple Query Protocol, который требует наш облачный провайдер. Пришлось переписать на синхронный psycopg2.

3. **Webhooks от ЮKassa без проверки подписи** — закрыли через час после релиза. Теперь проверяем HMAC на стороне backend.

4. **Кэш в Redis** — отказались. PostgreSQL с `pg_stat_statements` показал, что медленных запросов после индексации нет, а Redis — это ещё одна точка отказа.

---

## Итого

MAIL-KA — это:

- **15 000 строк** Python в backend;
- **22 000 строк** TypeScript/React в frontend;
- **0 контейнеров** в проде;
- **3 человека** в команде;
- **6 месяцев** от идеи до публичного запуска;
- **~2 000 ₽** в месяц на инфраструктуру при 50 активных клиентах.

Если интересно посмотреть вживую — заходите на [mail-ka.ru](https://mail-ka.ru), 7 дней бесплатно без карты. В комментариях отвечу на технические вопросы по архитектуре, очереди и интеграции с polza.ai.

---

**Теги Habr:** email, маркетинг, python, postgresql, cloud functions, gpt-4, claude, polza.ai, ии копирайтер, serverless, react, vite, smtp, dkim, очередь сообщений, omnichannel, predictive analytics

**Ключевые слова:** email маркетинг, рассылка email, ИИ-копирайтер, GPT-4o, polza.ai, postgresql очередь, cloud functions, российский SaaS, замена Mailchimp, MAIL-KA
