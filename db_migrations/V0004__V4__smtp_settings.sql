
CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.smtp_settings (
  id SERIAL PRIMARY KEY,
  is_active BOOLEAN DEFAULT TRUE,
  provider_preset VARCHAR(50),
  smtp_host VARCHAR(255) NOT NULL,
  smtp_port INTEGER NOT NULL DEFAULT 587,
  use_tls BOOLEAN DEFAULT TRUE,
  use_ssl BOOLEAN DEFAULT FALSE,
  username VARCHAR(255) NOT NULL,
  password VARCHAR(500) NOT NULL,
  from_email VARCHAR(255) NOT NULL,
  from_name VARCHAR(255) DEFAULT 'MAIL-KA',
  daily_limit INTEGER DEFAULT 500,
  test_status VARCHAR(50),
  test_error TEXT,
  tested_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_smtp_active ON t_p46602131_mailflow_automation.smtp_settings(is_active);
