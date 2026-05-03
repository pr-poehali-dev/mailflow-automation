-- Усиление защиты pro-api и public-api: user_id во всех таблицах ресурсов

ALTER TABLE t_p46602131_mailflow_automation.api_keys
  ADD COLUMN IF NOT EXISTS user_id INTEGER NULL
  REFERENCES t_p46602131_mailflow_automation.users(id);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id
  ON t_p46602131_mailflow_automation.api_keys(user_id);

ALTER TABLE t_p46602131_mailflow_automation.ab_tests
  ADD COLUMN IF NOT EXISTS user_id INTEGER NULL
  REFERENCES t_p46602131_mailflow_automation.users(id);
CREATE INDEX IF NOT EXISTS idx_ab_tests_user_id
  ON t_p46602131_mailflow_automation.ab_tests(user_id);

ALTER TABLE t_p46602131_mailflow_automation.trigger_rules
  ADD COLUMN IF NOT EXISTS user_id INTEGER NULL
  REFERENCES t_p46602131_mailflow_automation.users(id);
CREATE INDEX IF NOT EXISTS idx_trigger_rules_user_id
  ON t_p46602131_mailflow_automation.trigger_rules(user_id);

ALTER TABLE t_p46602131_mailflow_automation.warmup_schedule
  ADD COLUMN IF NOT EXISTS user_id INTEGER NULL
  REFERENCES t_p46602131_mailflow_automation.users(id);
CREATE INDEX IF NOT EXISTS idx_warmup_schedule_user_id
  ON t_p46602131_mailflow_automation.warmup_schedule(user_id);

ALTER TABLE t_p46602131_mailflow_automation.api_events
  ADD COLUMN IF NOT EXISTS user_id INTEGER NULL
  REFERENCES t_p46602131_mailflow_automation.users(id);
CREATE INDEX IF NOT EXISTS idx_api_events_user_id
  ON t_p46602131_mailflow_automation.api_events(user_id);
