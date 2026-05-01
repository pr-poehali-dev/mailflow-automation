"""
AI-копирайтер MAIL-KA на базе polza.ai (OpenAI-совместимый API, оплата в рублях, без VPN).

Эндпоинты:
  POST ?action=generate     — сгенерировать письмо по brief'у
  POST ?action=improve      — улучшить существующий текст (короче/дружелюбнее/проф)
  POST ?action=subject      — придумать 5 вариантов темы
  POST ?action=spam_check   — проверить на спам-триггеры
  POST ?action=predict      — предсказать open rate
  POST ?action=segment      — AI-сегментация (natural language → SQL-фильтр)
"""
import json
import os
import urllib.request
import urllib.error

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
}

POLZA_URL = "https://api.polza.ai/api/v1/chat/completions"
MODEL = "openai/gpt-4o-mini"


def resp(status: int, body: dict) -> dict:
    return {"statusCode": status, "headers": CORS, "body": json.dumps(body, ensure_ascii=False)}


def call_openai(messages: list, temperature: float = 0.8, json_mode: bool = False) -> dict:
    api_key = os.environ.get("POLZA_AI_API_KEY", "")
    if not api_key:
        return {"ok": False, "error": "POLZA_AI_API_KEY не настроен. Добавь его в Секреты."}

    payload = {
        "model": MODEL,
        "messages": messages,
        "temperature": temperature,
    }
    if json_mode:
        payload["response_format"] = {"type": "json_object"}

    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(POLZA_URL, data=data, method="POST")
    req.add_header("Content-Type", "application/json")
    req.add_header("Authorization", f"Bearer {api_key}")

    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            result = json.loads(r.read().decode())
            text = result["choices"][0]["message"]["content"]
            usage = result.get("usage", {})
            return {"ok": True, "text": text, "tokens": usage.get("total_tokens", 0)}
    except urllib.error.HTTPError as e:
        body_err = e.read().decode()
        return {"ok": False, "error": f"polza.ai HTTP {e.code}: {body_err[:300]}"}
    except Exception as ex:
        return {"ok": False, "error": str(ex)[:300]}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "POST")
    if method != "POST":
        return resp(405, {"error": "Только POST"})

    qs = event.get("queryStringParameters") or {}
    action = qs.get("action", "generate")

    body_raw = event.get("body") or "{}"
    try:
        body = json.loads(body_raw)
    except Exception:
        body = {}

    # ── Генерация письма по brief ────────────────────────────────────────────
    if action == "generate":
        brief = body.get("brief", "").strip()
        tone = body.get("tone", "дружелюбный")
        audience = body.get("audience", "клиенты")
        goal = body.get("goal", "продажа")
        if not brief:
            return resp(400, {"error": "Опиши задачу в поле 'brief'"})

        system = (
            "Ты — топовый российский email-копирайтер с опытом в Mailchimp и Klaviyo. "
            "Пишешь продающие письма на русском языке, которые действительно открывают и читают. "
            "Используй переменные {{first_name}} для персонализации. "
            "Структура: цепляющая тема, прехедер, тело письма, чёткий CTA. "
            "Тон — живой, без канцелярита, без спам-слов (СКИДКА!!!, ВЫИГРАЙ, ДЕНЬГИ). "
            "Длина тела — 80-150 слов, абзацы по 1-2 предложения. "
            "Отвечай в JSON: {subject, preheader, body, cta_text}"
        )
        user = (
            f"Задача: {brief}\n"
            f"Тон: {tone}\n"
            f"Аудитория: {audience}\n"
            f"Цель: {goal}\n\n"
            "Сгенерируй письмо."
        )

        result = call_openai([
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ], temperature=0.85, json_mode=True)

        if not result["ok"]:
            return resp(502, result)

        try:
            parsed = json.loads(result["text"])
            return resp(200, {"ok": True, **parsed, "tokens": result["tokens"]})
        except Exception:
            return resp(200, {"ok": True, "raw": result["text"]})

    # ── Улучшение текста ─────────────────────────────────────────────────────
    if action == "improve":
        text = body.get("text", "").strip()
        instruction = body.get("instruction", "сделай текст лучше")
        if not text:
            return resp(400, {"error": "Передай 'text' для улучшения"})

        system = (
            "Ты — редактор писем. Улучшаешь email-текст по инструкции пользователя. "
            "Сохраняй переменные вида {{first_name}}. "
            "Возвращай только новый текст без комментариев."
        )
        user = f"Текст:\n{text}\n\nИнструкция: {instruction}"

        result = call_openai([
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ], temperature=0.7)

        if not result["ok"]:
            return resp(502, result)
        return resp(200, {"ok": True, "text": result["text"], "tokens": result["tokens"]})

    # ── Варианты темы ────────────────────────────────────────────────────────
    if action == "subject":
        body_text = body.get("body", "").strip()
        context_str = body.get("context", "")
        if not body_text and not context_str:
            return resp(400, {"error": "Передай 'body' (текст письма) или 'context'"})

        system = (
            "Ты — копирайтер тем для email. Придумываешь 5 кардинально разных вариантов: "
            "1) интригующий, 2) с цифрой/выгодой, 3) персональный, 4) с эмоцией, 5) короткий. "
            "Длина каждой темы — до 50 символов. Без СПАМ-слов, без КАПСА. "
            "Можно использовать 1 уместный эмодзи. "
            "Отвечай в JSON: {variants: [{type, text, why}]}"
        )
        user = f"Контекст: {context_str}\n\nТекст письма:\n{body_text}"

        result = call_openai([
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ], temperature=0.95, json_mode=True)

        if not result["ok"]:
            return resp(502, result)
        try:
            parsed = json.loads(result["text"])
            return resp(200, {"ok": True, **parsed})
        except Exception:
            return resp(200, {"ok": True, "raw": result["text"]})

    # ── Spam-check ───────────────────────────────────────────────────────────
    if action == "spam_check":
        subject = body.get("subject", "")
        text = body.get("text", "")

        system = (
            "Ты — анти-спам анализатор email. Проверяешь субъект и текст на признаки спама "
            "(капс, восклицания, спам-слова: ХАЛЯВА, СРОЧНО, БЕСПЛАТНО, выиграй, гарантирую). "
            "Также оцениваешь читабельность и эмоциональность. "
            "Отвечай в JSON: {spam_score: 0-100 (0=хорошо, 100=спам), "
            "issues: [список проблем], suggestions: [рекомендации], readability: 'отлично'/'хорошо'/'плохо'}"
        )
        user = f"Тема: {subject}\n\nТекст:\n{text}"

        result = call_openai([
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ], temperature=0.3, json_mode=True)

        if not result["ok"]:
            return resp(502, result)
        try:
            parsed = json.loads(result["text"])
            return resp(200, {"ok": True, **parsed})
        except Exception:
            return resp(200, {"ok": True, "raw": result["text"]})

    # ── Прогноз open rate ────────────────────────────────────────────────────
    if action == "predict":
        subject = body.get("subject", "")
        if not subject:
            return resp(400, {"error": "Передай 'subject'"})

        system = (
            "Ты — аналитик email-маркетинга. Оцениваешь, насколько хороша тема письма для open rate. "
            "Учитываешь: длину, эмоцию, интригу, персонализацию, спам-факторы. "
            "Отвечай в JSON: {predicted_open_rate: число от 5 до 60 (%), "
            "rating: 'плохо'/'средне'/'хорошо'/'отлично', "
            "reason: краткое объяснение, "
            "improvements: [3 совета как улучшить]}"
        )
        result = call_openai([
            {"role": "system", "content": system},
            {"role": "user", "content": f"Тема: {subject}"},
        ], temperature=0.4, json_mode=True)

        if not result["ok"]:
            return resp(502, result)
        try:
            parsed = json.loads(result["text"])
            return resp(200, {"ok": True, **parsed})
        except Exception:
            return resp(200, {"ok": True, "raw": result["text"]})

    # ── AI-сегментация (natural language → описание сегмента) ────────────────
    if action == "segment":
        query = body.get("query", "").strip()
        if not query:
            return resp(400, {"error": "Опиши сегмент в поле 'query'"})

        system = (
            "Ты — ассистент по сегментации контактов в email-маркетинге. "
            "По описанию пользователя возвращаешь критерии сегмента. "
            "Доступные поля: name, email, segment (VIP/Активный/Спящий/Новый), status (active/unsubscribed), "
            "engagement_score (0-100), last_opened_at, last_clicked_at, created_at. "
            "Отвечай в JSON: {name: имя сегмента, description: что значит, "
            "filters: [{field, operator, value}], estimated_size: примерная доля контактов 0-100}"
        )
        result = call_openai([
            {"role": "system", "content": system},
            {"role": "user", "content": query},
        ], temperature=0.5, json_mode=True)

        if not result["ok"]:
            return resp(502, result)
        try:
            parsed = json.loads(result["text"])
            return resp(200, {"ok": True, **parsed})
        except Exception:
            return resp(200, {"ok": True, "raw": result["text"]})

    return resp(404, {"error": f"Неизвестный action: {action}"})