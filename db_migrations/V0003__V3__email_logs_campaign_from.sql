
CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.email_logs (
  id SERIAL PRIMARY KEY,
  campaign_id INTEGER REFERENCES t_p46602131_mailflow_automation.campaigns(id),
  contact_id INTEGER REFERENCES t_p46602131_mailflow_automation.contacts(id),
  to_email VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  status VARCHAR(50) DEFAULT 'queued',
  mailgun_id VARCHAR(255),
  error_msg TEXT,
  sent_at TIMESTAMP DEFAULT NOW()
);

ALTER TABLE t_p46602131_mailflow_automation.campaigns
  ADD COLUMN IF NOT EXISTS from_name VARCHAR(255) DEFAULT 'MAIL-KA',
  ADD COLUMN IF NOT EXISTS from_email VARCHAR(255) DEFAULT '',
  ADD COLUMN IF NOT EXISTS reply_to VARCHAR(255) DEFAULT '';
