-- Очистим rate-limits перед тестом
UPDATE t_p46602131_mailflow_automation.rate_limits 
SET created_at = created_at - INTERVAL '2 hours' 
WHERE created_at > NOW() - INTERVAL '1 hour';
