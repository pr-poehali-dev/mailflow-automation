-- Журнал партнёрских заявок на корпоративную почту (Beget Mail / Yandex 360 / VK WorkSpace)
-- Используется для трекинга конверсий, расчёта комиссии партнёрки, отчётности.

CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.mailbox_orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NULL REFERENCES t_p46602131_mailflow_automation.users(id),
  provider VARCHAR(40) NOT NULL,
  plan_code VARCHAR(60) NULL,
  domain VARCHAR(255) NULL,
  mailboxes_count INTEGER NULL,
  contact_email VARCHAR(255) NULL,
  contact_name VARCHAR(255) NULL,
  contact_phone VARCHAR(50) NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'click',
  ref_url TEXT NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(500) NULL,
  utm_source VARCHAR(100) NULL,
  notes TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_mailbox_orders_user ON t_p46602131_mailflow_automation.mailbox_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_mailbox_orders_provider ON t_p46602131_mailflow_automation.mailbox_orders(provider);
CREATE INDEX IF NOT EXISTS idx_mailbox_orders_status ON t_p46602131_mailflow_automation.mailbox_orders(status);
CREATE INDEX IF NOT EXISTS idx_mailbox_orders_created ON t_p46602131_mailflow_automation.mailbox_orders(created_at DESC);
