
-- Трекинг открытий и кликов
CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.email_events (
  id BIGSERIAL PRIMARY KEY,
  email_log_id INTEGER REFERENCES t_p46602131_mailflow_automation.email_logs(id),
  campaign_id INTEGER REFERENCES t_p46602131_mailflow_automation.campaigns(id),
  contact_id INTEGER REFERENCES t_p46602131_mailflow_automation.contacts(id),
  event_type VARCHAR(50) NOT NULL,
  link_url TEXT,
  user_agent TEXT,
  ip_address VARCHAR(64),
  geo_country VARCHAR(10),
  geo_city VARCHAR(100),
  device_type VARCHAR(30),
  client_name VARCHAR(100),
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_email_events_log ON t_p46602131_mailflow_automation.email_events(email_log_id);
CREATE INDEX IF NOT EXISTS idx_email_events_campaign ON t_p46602131_mailflow_automation.email_events(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON t_p46602131_mailflow_automation.email_events(event_type);

-- Уникальный токен для каждого отправленного письма (для трекинга)
ALTER TABLE t_p46602131_mailflow_automation.email_logs
  ADD COLUMN IF NOT EXISTS tracking_token VARCHAR(64),
  ADD COLUMN IF NOT EXISTS opened_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS clicked_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS bounce_type VARCHAR(30);
CREATE INDEX IF NOT EXISTS idx_email_logs_token ON t_p46602131_mailflow_automation.email_logs(tracking_token);

-- Suppression list (запрещённые адреса: bounce, complaint, unsubscribe)
CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.suppression_list (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  reason VARCHAR(50) NOT NULL,
  details TEXT,
  added_at TIMESTAMP DEFAULT NOW()
);

-- A/B тесты
CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.ab_tests (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES t_p46602131_mailflow_automation.campaigns(id),
  name VARCHAR(255) NOT NULL,
  variant_a_subject VARCHAR(500),
  variant_a_body TEXT,
  variant_b_subject VARCHAR(500),
  variant_b_body TEXT,
  split_percent INTEGER DEFAULT 50,
  winner VARCHAR(10),
  status VARCHAR(30) DEFAULT 'draft',
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE t_p46602131_mailflow_automation.email_logs
  ADD COLUMN IF NOT EXISTS ab_variant VARCHAR(10);

-- Automation Flows (визуальные сценарии: триггер → действие → задержка → ...)
CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.automation_flows (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  trigger_type VARCHAR(50) NOT NULL,
  trigger_config JSONB DEFAULT '{}',
  steps JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT FALSE,
  total_started INTEGER DEFAULT 0,
  total_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Запуски automation для конкретных контактов
CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.automation_runs (
  id BIGSERIAL PRIMARY KEY,
  flow_id INTEGER REFERENCES t_p46602131_mailflow_automation.automation_flows(id),
  contact_id INTEGER REFERENCES t_p46602131_mailflow_automation.contacts(id),
  current_step INTEGER DEFAULT 0,
  status VARCHAR(30) DEFAULT 'running',
  next_run_at TIMESTAMP,
  context JSONB DEFAULT '{}',
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_automation_runs_next ON t_p46602131_mailflow_automation.automation_runs(next_run_at);
CREATE INDEX IF NOT EXISTS idx_automation_runs_status ON t_p46602131_mailflow_automation.automation_runs(status);

-- Прогрев домена (warmup): постепенное наращивание объёма
CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.warmup_schedule (
  id SERIAL PRIMARY KEY,
  is_active BOOLEAN DEFAULT FALSE,
  started_at TIMESTAMP,
  current_day INTEGER DEFAULT 1,
  daily_volume INTEGER DEFAULT 50,
  target_volume INTEGER DEFAULT 5000,
  growth_percent INTEGER DEFAULT 30,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Double opt-in подтверждения
CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.optin_tokens (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  token VARCHAR(64) UNIQUE NOT NULL,
  contact_id INTEGER REFERENCES t_p46602131_mailflow_automation.contacts(id),
  confirmed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Дополнительные поля для контактов: scoring и тэги
ALTER TABLE t_p46602131_mailflow_automation.contacts
  ADD COLUMN IF NOT EXISTS engagement_score INTEGER DEFAULT 50,
  ADD COLUMN IF NOT EXISTS tags JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS last_opened_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS last_clicked_at TIMESTAMP,
  ADD COLUMN IF NOT EXISTS confirmed BOOLEAN DEFAULT TRUE;

-- Шаблоны (готовая библиотека)
CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.email_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(50),
  subject VARCHAR(500),
  preheader VARCHAR(255),
  body_text TEXT,
  body_html TEXT,
  preview_emoji VARCHAR(10),
  uses_count INTEGER DEFAULT 0,
  is_system BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

INSERT INTO t_p46602131_mailflow_automation.email_templates (name, category, subject, preheader, body_text, preview_emoji, is_system)
SELECT * FROM (VALUES
  ('Приветственное письмо', 'Онбординг', 'Добро пожаловать в {{company_name}}, {{first_name}}!', 'Рады знакомству', 'Привет, {{first_name}}!\n\nСпасибо что присоединились к нам. Вот что вас ждёт дальше:\n\n• Полезные советы каждую неделю\n• Эксклюзивные предложения\n• Поддержка 24/7\n\nЕсли есть вопросы — просто ответьте на это письмо.\n\nКоманда {{company_name}}', '👋', TRUE),
  ('Брошенная корзина', 'Триггер', '{{first_name}}, забыли что-то?', 'Ваша корзина ждёт', 'Здравствуйте, {{first_name}}!\n\nВы оставили товары в корзине. Чтобы они не потерялись, мы сохранили их специально для вас.\n\nЗавершите заказ за 3 клика и получите скидку 10% по промокоду CART10.\n\nДействует 24 часа.', '🛒', TRUE),
  ('Реактивация', 'Retention', 'Соскучились! Возвращайтесь — у нас новости', 'Что вы пропустили', 'Привет, {{first_name}}!\n\nДавно вас не видели. За это время у нас:\n\n• 3 новых продукта\n• Обновлённый интерфейс\n• Скидки до 40%\n\nЗабирайте промокод BACK20 и возвращайтесь — он даёт 20% на любой заказ.', '💫', TRUE),
  ('С днём рождения', 'Триггер', 'С днём рождения, {{first_name}}! 🎂', 'Подарок внутри', 'С праздником, {{first_name}}!\n\nЖелаем вам исполнения желаний и отличного настроения.\n\nА от нас — подарок: скидка 25% на весь ассортимент по промокоду BIRTHDAY25. Действует неделю.', '🎂', TRUE),
  ('Новости месяца', 'Контент', 'Дайджест месяца: топ-5 материалов', 'Главное за месяц', 'Привет, {{first_name}}!\n\nСобрали для вас главное за прошлый месяц:\n\n1. Тренды индустрии\n2. Новые кейсы клиентов\n3. Обзор обновлений\n4. Полезные гайды\n5. Анонс мероприятий\n\nЧитайте на сайте.', '📰', TRUE),
  ('Промо-акция', 'Продажи', 'Только 48 часов: скидки до 50%', 'Не пропустите', 'Большая распродажа уже идёт!\n\n• Электроника — до 40%\n• Одежда — до 50%\n• Книги — 2 по цене 1\n\nАкция действует 48 часов. Промокод не нужен.', '🔥', TRUE)
) AS t(name, category, subject, preheader, body_text, preview_emoji, is_system)
WHERE NOT EXISTS (SELECT 1 FROM t_p46602131_mailflow_automation.email_templates LIMIT 1);
