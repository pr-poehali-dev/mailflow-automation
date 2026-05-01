
CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.dkim_keys (
  id SERIAL PRIMARY KEY,
  domain VARCHAR(255) NOT NULL UNIQUE,
  selector VARCHAR(50) NOT NULL DEFAULT 'mailka',
  private_key TEXT NOT NULL,
  public_key TEXT NOT NULL,
  dns_record TEXT NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.warmup_plans (
  id SERIAL PRIMARY KEY,
  domain VARCHAR(255) NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT TRUE,
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_day INTEGER DEFAULT 1,
  target_volume INTEGER DEFAULT 10000,
  total_days INTEGER DEFAULT 30,
  pause_on_complaints BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p46602131_mailflow_automation.warmup_daily_stats (
  id SERIAL PRIMARY KEY,
  plan_id INTEGER REFERENCES t_p46602131_mailflow_automation.warmup_plans(id),
  day_number INTEGER NOT NULL,
  date DATE NOT NULL,
  daily_limit INTEGER NOT NULL,
  sent_count INTEGER DEFAULT 0,
  bounce_count INTEGER DEFAULT 0,
  complaint_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_warmup_stats_plan ON t_p46602131_mailflow_automation.warmup_daily_stats(plan_id, date);
