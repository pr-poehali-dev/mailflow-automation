-- Email verification fields and tokens table
ALTER TABLE t_p46602131_mailflow_automation.users
  ADD COLUMN IF NOT EXISTS verification_sent_at TIMESTAMP;

CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.email_verifications (
  id            BIGSERIAL PRIMARY KEY,
  user_id       INTEGER NOT NULL REFERENCES t_p46602131_mailflow_automation.users(id),
  token_hash    VARCHAR(128) NOT NULL UNIQUE,
  email         VARCHAR(255) NOT NULL,
  expires_at    TIMESTAMP NOT NULL,
  used_at       TIMESTAMP,
  created_at    TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_email_verifications_user
  ON t_p46602131_mailflow_automation.email_verifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verifications_expires
  ON t_p46602131_mailflow_automation.email_verifications(expires_at);
