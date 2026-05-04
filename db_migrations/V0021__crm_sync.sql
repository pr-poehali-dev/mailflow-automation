-- Поля для CRM-источника контакта (откуда пришёл и какой ID в CRM)
ALTER TABLE t_p46602131_mailflow_automation.contacts
    ADD COLUMN IF NOT EXISTS crm_source VARCHAR(32),
    ADD COLUMN IF NOT EXISTS crm_external_id VARCHAR(64),
    ADD COLUMN IF NOT EXISTS crm_synced_at TIMESTAMP WITHOUT TIME ZONE;

CREATE INDEX IF NOT EXISTS idx_contacts_crm_source
    ON t_p46602131_mailflow_automation.contacts(user_id, crm_source);

-- Уникальность по (user_id, crm_source, crm_external_id) — чтобы не дублировать при повторной синхронизации
CREATE UNIQUE INDEX IF NOT EXISTS uq_contacts_crm_external
    ON t_p46602131_mailflow_automation.contacts(user_id, crm_source, crm_external_id)
    WHERE crm_external_id IS NOT NULL;

-- Лог синхронизаций
CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.crm_sync_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    provider VARCHAR(32) NOT NULL,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    finished_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(16) DEFAULT 'running',
    fetched_count INTEGER DEFAULT 0,
    inserted_count INTEGER DEFAULT 0,
    updated_count INTEGER DEFAULT 0,
    skipped_count INTEGER DEFAULT 0,
    error_message TEXT
);

CREATE INDEX IF NOT EXISTS idx_crm_sync_log_user
    ON t_p46602131_mailflow_automation.crm_sync_log(user_id, provider, started_at DESC);

-- Денормализованное поле "последняя синхронизация" в crm_connections (для быстрой выборки)
ALTER TABLE t_p46602131_mailflow_automation.crm_connections
    ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMP WITH TIME ZONE,
    ADD COLUMN IF NOT EXISTS last_sync_status VARCHAR(16),
    ADD COLUMN IF NOT EXISTS last_sync_count INTEGER DEFAULT 0;
