
CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.api_keys (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL UNIQUE,
  key_preview VARCHAR(20) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  last_used_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.api_events (
  id SERIAL PRIMARY KEY,
  api_key_id INTEGER REFERENCES t_p46602131_mailflow_automation.api_keys(id),
  event_type VARCHAR(100) NOT NULL,
  payload JSONB,
  status VARCHAR(50) DEFAULT 'ok',
  error_msg TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.trigger_rules (
  id SERIAL PRIMARY KEY,
  event_name VARCHAR(255) NOT NULL,
  campaign_id INTEGER REFERENCES t_p46602131_mailflow_automation.campaigns(id),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
