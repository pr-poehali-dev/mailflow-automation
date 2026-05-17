CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.partner_applications (
    id SERIAL PRIMARY KEY,
    program VARCHAR(40) NOT NULL DEFAULT 'referral',
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    channel VARCHAR(500),
    audience TEXT,
    status VARCHAR(30) NOT NULL DEFAULT 'new',
    user_id INTEGER REFERENCES t_p46602131_mailflow_automation.users(id) ON UPDATE CASCADE,
    ip_address VARCHAR(64),
    user_agent VARCHAR(500),
    utm_source VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partner_apps_email ON t_p46602131_mailflow_automation.partner_applications(email);
CREATE INDEX IF NOT EXISTS idx_partner_apps_status ON t_p46602131_mailflow_automation.partner_applications(status);
CREATE INDEX IF NOT EXISTS idx_partner_apps_created ON t_p46602131_mailflow_automation.partner_applications(created_at DESC);