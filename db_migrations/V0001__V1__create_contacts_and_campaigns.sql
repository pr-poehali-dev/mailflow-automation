
CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.contacts (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  segment VARCHAR(100) DEFAULT 'Новый',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.campaigns (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  subject VARCHAR(500) DEFAULT '',
  preheader VARCHAR(500) DEFAULT '',
  body_text TEXT DEFAULT '',
  sent_count INTEGER DEFAULT 0,
  open_rate NUMERIC(5,2) DEFAULT 0,
  click_rate NUMERIC(5,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  sent_at TIMESTAMP
);

INSERT INTO t_p46602131_mailflow_automation.contacts (name, email, segment, status) VALUES
  ('Анна Морозова', 'anna@company.ru', 'VIP', 'active'),
  ('Дмитрий Козлов', 'd.kozlov@mail.ru', 'Новый', 'active'),
  ('Мария Соколова', 'msokolova@yandex.ru', 'Спящий', 'unsubscribed'),
  ('Игорь Петров', 'igor.petrov@biz.ru', 'VIP', 'active'),
  ('Елена Новикова', 'enovikova@firm.ru', 'Активный', 'active'),
  ('Сергей Волков', 's.volkov@corp.ru', 'Активный', 'active')
ON CONFLICT (email) DO NOTHING;

INSERT INTO t_p46602131_mailflow_automation.campaigns (name, status, subject, sent_count, open_rate, click_rate, sent_at) VALUES
  ('Летняя распродажа 2026', 'active', 'Скидки до 50%!', 12400, 34.2, 8.1, NOW() - INTERVAL '2 days'),
  ('Реактивация спящих', 'sent', 'Мы скучаем по вам', 5800, 19.7, 4.3, NOW() - INTERVAL '6 days'),
  ('Welcome-серия (A/B)', 'active', 'Добро пожаловать!', 3210, 41.0, 12.5, NOW() - INTERVAL '10 days'),
  ('Апрельский дайджест', 'sent', 'Лучшее за апрель', 48100, 22.1, 5.9, NOW() - INTERVAL '15 days'),
  ('Брошенная корзина', 'paused', 'Вы забыли кое-что', 980, 38.4, 17.2, NOW() - INTERVAL '20 days'),
  ('Онбординг новых юзеров', 'draft', 'Начните прямо сейчас', 0, 0, 0, NULL);
