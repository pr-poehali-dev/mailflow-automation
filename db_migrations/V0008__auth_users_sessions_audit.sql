CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    email_lower     VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    name            VARCHAR(120) NOT NULL DEFAULT '',
    role            VARCHAR(20)  NOT NULL DEFAULT 'user',
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    is_email_verified BOOLEAN    NOT NULL DEFAULT FALSE,
    failed_attempts INTEGER      NOT NULL DEFAULT 0,
    locked_until    TIMESTAMP,
    last_login_at   TIMESTAMP,
    last_login_ip   VARCHAR(64),
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email_lower ON t_p46602131_mailflow_automation.users (email_lower);

CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.user_sessions (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES t_p46602131_mailflow_automation.users(id) ON UPDATE CASCADE,
    token_hash      VARCHAR(128) NOT NULL UNIQUE,
    csrf_token      VARCHAR(128) NOT NULL,
    user_agent      VARCHAR(500),
    ip_address      VARCHAR(64),
    expires_at      TIMESTAMP NOT NULL,
    revoked_at      TIMESTAMP,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sessions_user ON t_p46602131_mailflow_automation.user_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON t_p46602131_mailflow_automation.user_sessions (token_hash);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON t_p46602131_mailflow_automation.user_sessions (expires_at);

CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.auth_audit_log (
    id              BIGSERIAL PRIMARY KEY,
    event_type      VARCHAR(50) NOT NULL,
    user_id         INTEGER,
    email           VARCHAR(255),
    ip_address      VARCHAR(64),
    user_agent      VARCHAR(500),
    success         BOOLEAN NOT NULL DEFAULT FALSE,
    details         TEXT,
    created_at      TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_email ON t_p46602131_mailflow_automation.auth_audit_log (email, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_ip ON t_p46602131_mailflow_automation.auth_audit_log (ip_address, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_event ON t_p46602131_mailflow_automation.auth_audit_log (event_type, created_at DESC);

CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.rate_limits (
    id              BIGSERIAL PRIMARY KEY,
    bucket_key      VARCHAR(120) NOT NULL,
    action          VARCHAR(50)  NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ratelimit_lookup ON t_p46602131_mailflow_automation.rate_limits (bucket_key, action, created_at DESC);
