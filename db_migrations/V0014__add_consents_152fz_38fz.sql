-- Соответствие 152-ФЗ "О персональных данных" и 38-ФЗ "О рекламе"
-- 1) Согласия пользователей системы (зафиксированы при регистрации)
-- 2) Согласия контактов (получателей рассылок)
-- 3) История изменений согласий

ALTER TABLE t_p46602131_mailflow_automation.users
  ADD COLUMN IF NOT EXISTS accepted_offer_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS accepted_privacy_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS accepted_marketing_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS consent_ip VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS consent_user_agent VARCHAR(500) NULL,
  ADD COLUMN IF NOT EXISTS consent_documents_version VARCHAR(20) NULL DEFAULT '1.0';

ALTER TABLE t_p46602131_mailflow_automation.contacts
  ADD COLUMN IF NOT EXISTS consent_status VARCHAR(20) NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS consent_source VARCHAR(50) NULL,
  ADD COLUMN IF NOT EXISTS consent_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS consent_ip VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS consent_text TEXT NULL,
  ADD COLUMN IF NOT EXISTS unsubscribed_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS unsubscribe_reason VARCHAR(255) NULL,
  ADD COLUMN IF NOT EXISTS double_optin_token VARCHAR(64) NULL,
  ADD COLUMN IF NOT EXISTS double_optin_sent_at TIMESTAMP NULL,
  ADD COLUMN IF NOT EXISTS double_optin_confirmed_at TIMESTAMP NULL;

CREATE INDEX IF NOT EXISTS idx_contacts_consent_status
  ON t_p46602131_mailflow_automation.contacts(consent_status);

CREATE INDEX IF NOT EXISTS idx_contacts_optin_token
  ON t_p46602131_mailflow_automation.contacts(double_optin_token);

-- История согласий: что, когда, как было получено / отозвано
CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.consent_log (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NULL REFERENCES t_p46602131_mailflow_automation.users(id),
  contact_id INTEGER NULL REFERENCES t_p46602131_mailflow_automation.contacts(id),
  action VARCHAR(50) NOT NULL,
  document VARCHAR(50) NULL,
  document_version VARCHAR(20) NULL,
  source VARCHAR(50) NULL,
  ip_address VARCHAR(64) NULL,
  user_agent VARCHAR(500) NULL,
  details TEXT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consent_log_user
  ON t_p46602131_mailflow_automation.consent_log(user_id);
CREATE INDEX IF NOT EXISTS idx_consent_log_contact
  ON t_p46602131_mailflow_automation.consent_log(contact_id);
CREATE INDEX IF NOT EXISTS idx_consent_log_created
  ON t_p46602131_mailflow_automation.consent_log(created_at DESC);

-- Версии юридических документов (для аудита, какой текст принимал пользователь)
CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.legal_documents (
  id SERIAL PRIMARY KEY,
  doc_key VARCHAR(50) NOT NULL,
  version VARCHAR(20) NOT NULL,
  title VARCHAR(255) NOT NULL,
  content_hash VARCHAR(64) NOT NULL,
  content_url VARCHAR(500) NULL,
  effective_from TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_legal_doc_version
  ON t_p46602131_mailflow_automation.legal_documents(doc_key, version);
