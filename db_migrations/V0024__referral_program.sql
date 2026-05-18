ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code VARCHAR(20) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by_code VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bonus_balance NUMERIC(10,2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_referred_by ON users(referred_by_code);

CREATE TABLE IF NOT EXISTS referrals (
  id SERIAL PRIMARY KEY,
  inviter_user_id INTEGER NOT NULL,
  invitee_user_id INTEGER,
  invitee_email VARCHAR(255) NOT NULL,
  referral_code VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  bonus_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  order_id INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  converted_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_referrals_inviter ON referrals(inviter_user_id);
CREATE INDEX IF NOT EXISTS idx_referrals_invitee_email ON referrals(invitee_email);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

CREATE TABLE IF NOT EXISTS bonus_transactions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  type VARCHAR(30) NOT NULL,
  description VARCHAR(255),
  referral_id INTEGER,
  order_id INTEGER,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_bonus_tx_user ON bonus_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_bonus_tx_type ON bonus_transactions(type);

UPDATE users
SET referral_code = UPPER(SUBSTR(MD5(id::text || email_lower), 1, 8))
WHERE referral_code IS NULL;
