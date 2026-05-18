CREATE TABLE IF NOT EXISTS promo_codes (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description VARCHAR(255),
  discount_type VARCHAR(20) NOT NULL DEFAULT 'percent',
  discount_value INTEGER NOT NULL,
  max_uses INTEGER,
  used_count INTEGER NOT NULL DEFAULT 0,
  applies_to VARCHAR(50) DEFAULT 'all',
  valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  valid_until TIMESTAMP,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promo_codes_code ON promo_codes(code);
CREATE INDEX IF NOT EXISTS idx_promo_codes_active ON promo_codes(is_active);

CREATE TABLE IF NOT EXISTS promo_code_uses (
  id SERIAL PRIMARY KEY,
  promo_code_id INTEGER NOT NULL,
  user_email VARCHAR(255) NOT NULL,
  order_id INTEGER,
  discount_applied NUMERIC(10,2) NOT NULL,
  used_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_promo_uses_code ON promo_code_uses(promo_code_id);
CREATE INDEX IF NOT EXISTS idx_promo_uses_email ON promo_code_uses(user_email);

ALTER TABLE orders ADD COLUMN IF NOT EXISTS promo_code VARCHAR(50);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS original_amount NUMERIC(10,2);

INSERT INTO promo_codes (code, description, discount_type, discount_value, max_uses, applies_to, valid_until)
VALUES
  ('FIRST30', 'Скидка 30% на первую покупку', 'percent', 30, 1000, 'first_purchase', CURRENT_TIMESTAMP + INTERVAL '90 days'),
  ('FRIEND50', 'Скидка 50% по рефералу', 'percent', 50, 500, 'all', CURRENT_TIMESTAMP + INTERVAL '180 days'),
  ('BLOGGER20', 'Скидка 20% по промокоду блогера', 'percent', 20, NULL, 'all', CURRENT_TIMESTAMP + INTERVAL '365 days'),
  ('WELCOME', 'Приветственная скидка 15%', 'percent', 15, NULL, 'first_purchase', CURRENT_TIMESTAMP + INTERVAL '365 days')
ON CONFLICT (code) DO NOTHING;
