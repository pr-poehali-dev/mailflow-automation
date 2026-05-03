-- Хелпер: чтобы быстро повысить пользователя до admin, выполните в БД:
--   UPDATE t_p46602131_mailflow_automation.users
--   SET role = 'admin', is_email_verified = TRUE, is_active = TRUE
--   WHERE email_lower = 'ваш_email@example.com';
--
-- Этот файл — placeholder для документации, не содержит изменений схемы.
-- Создаём индекс по role для быстрого поиска админов.

CREATE INDEX IF NOT EXISTS idx_users_role
  ON t_p46602131_mailflow_automation.users(role);
