-- Назначение пользователя atyurin2@yandex.ru администратором ЦУП
UPDATE t_p46602131_mailflow_automation.users
SET role = 'admin',
    is_email_verified = TRUE,
    is_active = TRUE,
    locked_until = NULL,
    failed_attempts = 0
WHERE email_lower = 'atyurin2@yandex.ru';
