-- Усиление защиты данных: добавляем user_id во все приватные таблицы.

ALTER TABLE t_p46602131_mailflow_automation.contacts
  ADD COLUMN IF NOT EXISTS user_id INTEGER NULL
  REFERENCES t_p46602131_mailflow_automation.users(id);

CREATE INDEX IF NOT EXISTS idx_contacts_user_id
  ON t_p46602131_mailflow_automation.contacts(user_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_user_email
  ON t_p46602131_mailflow_automation.contacts(user_id, email);

ALTER TABLE t_p46602131_mailflow_automation.campaigns
  ADD COLUMN IF NOT EXISTS user_id INTEGER NULL
  REFERENCES t_p46602131_mailflow_automation.users(id);

CREATE INDEX IF NOT EXISTS idx_campaigns_user_id
  ON t_p46602131_mailflow_automation.campaigns(user_id);

ALTER TABLE t_p46602131_mailflow_automation.email_templates
  ADD COLUMN IF NOT EXISTS user_id INTEGER NULL
  REFERENCES t_p46602131_mailflow_automation.users(id);

CREATE INDEX IF NOT EXISTS idx_templates_user_id
  ON t_p46602131_mailflow_automation.email_templates(user_id);

ALTER TABLE t_p46602131_mailflow_automation.smtp_settings
  ADD COLUMN IF NOT EXISTS user_id INTEGER NULL
  REFERENCES t_p46602131_mailflow_automation.users(id);

CREATE INDEX IF NOT EXISTS idx_smtp_user_id
  ON t_p46602131_mailflow_automation.smtp_settings(user_id);

ALTER TABLE t_p46602131_mailflow_automation.automation_flows
  ADD COLUMN IF NOT EXISTS user_id INTEGER NULL
  REFERENCES t_p46602131_mailflow_automation.users(id);

CREATE INDEX IF NOT EXISTS idx_automation_user_id
  ON t_p46602131_mailflow_automation.automation_flows(user_id);

ALTER TABLE t_p46602131_mailflow_automation.suppression_list
  ADD COLUMN IF NOT EXISTS user_id INTEGER NULL
  REFERENCES t_p46602131_mailflow_automation.users(id);

CREATE INDEX IF NOT EXISTS idx_suppression_user_id
  ON t_p46602131_mailflow_automation.suppression_list(user_id);
