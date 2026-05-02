-- Поля маркировки рекламы (38-ФЗ, ОРД) для кампаний
ALTER TABLE t_p46602131_mailflow_automation.campaigns
  ADD COLUMN IF NOT EXISTS is_advertising BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS erid VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS advertiser_name VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS advertiser_inn VARCHAR(20) NULL;

COMMENT ON COLUMN t_p46602131_mailflow_automation.campaigns.is_advertising IS 'Пометка "Реклама" в письмах кампании (38-ФЗ)';
COMMENT ON COLUMN t_p46602131_mailflow_automation.campaigns.erid IS 'Токен ОРД (erid) для маркировки интернет-рекламы';
COMMENT ON COLUMN t_p46602131_mailflow_automation.campaigns.advertiser_name IS 'Наименование рекламодателя для подстановки в письмо';
COMMENT ON COLUMN t_p46602131_mailflow_automation.campaigns.advertiser_inn IS 'ИНН рекламодателя для маркировки рекламы';
