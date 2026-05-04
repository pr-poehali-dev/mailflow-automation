-- CRM-подключения пользователей (OAuth-токены и состояние)
CREATE TABLE IF NOT EXISTS crm_connections (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    provider VARCHAR(32) NOT NULL,
    domain VARCHAR(255),
    access_token TEXT,
    refresh_token TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    account_info JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(16) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE (user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_crm_connections_user ON crm_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_connections_provider ON crm_connections(provider);

-- OAuth state-параметры (анти-CSRF, короткоживущие)
CREATE TABLE IF NOT EXISTS crm_oauth_states (
    state VARCHAR(64) PRIMARY KEY,
    user_id INTEGER NOT NULL,
    provider VARCHAR(32) NOT NULL,
    domain VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_oauth_states_created ON crm_oauth_states(created_at);
