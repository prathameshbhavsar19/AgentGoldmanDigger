-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL DEFAULT 'Guest',
  last_name TEXT,
  email TEXT,
  country TEXT,
  currency TEXT DEFAULT 'USD',
  age_range TEXT,
  employment_status TEXT,
  user_folder_path TEXT,
  created_at TEXT NOT NULL
);

-- Onboarding sessions
CREATE TABLE IF NOT EXISTS onboarding_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  primary_financial_concern TEXT,
  investment_goal TEXT,
  time_horizon TEXT,
  monthly_investment_capacity TEXT,
  emergency_savings TEXT,
  risk_reaction TEXT,
  investment_familiarity TEXT,
  current_investment_status TEXT,
  portfolio_review_intent TEXT,
  experience_tone TEXT,
  consent_given INTEGER DEFAULT 0,
  current_step TEXT NOT NULL DEFAULT 'customer',
  status TEXT NOT NULL DEFAULT 'in_progress',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Portfolio files
CREATE TABLE IF NOT EXISTS portfolio_files (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_path TEXT NOT NULL,
  upload_status TEXT NOT NULL DEFAULT 'uploaded',
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (session_id) REFERENCES onboarding_sessions(id)
);

-- Portfolio holdings
CREATE TABLE IF NOT EXISTS portfolio_holdings (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  asset_name TEXT NOT NULL,
  asset_symbol TEXT,
  asset_type TEXT,
  quantity REAL,
  market_value REAL,
  currency TEXT,
  sector TEXT,
  region TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (session_id) REFERENCES onboarding_sessions(id)
);

-- Strategy jobs
CREATE TABLE IF NOT EXISTS strategy_jobs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'created',
  python_job_id TEXT,
  started_at TEXT,
  completed_at TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (session_id) REFERENCES onboarding_sessions(id)
);

-- AI events
CREATE TABLE IF NOT EXISTS ai_events (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  status TEXT,
  display_message TEXT,
  raw_event_json TEXT,
  seq INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  FOREIGN KEY (job_id) REFERENCES strategy_jobs(id)
);

-- Canvas modules
CREATE TABLE IF NOT EXISTS canvas_modules (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  module_type TEXT NOT NULL,
  priority INTEGER NOT NULL,
  module_json TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (job_id) REFERENCES strategy_jobs(id)
);

-- Final reports
CREATE TABLE IF NOT EXISTS final_reports (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  report_title TEXT NOT NULL DEFAULT 'Your Personalized Portfolio Strategy',
  ai_summary TEXT,
  final_canvas_json TEXT NOT NULL,
  metadata_json TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (job_id) REFERENCES strategy_jobs(id)
);

-- Follow-up messages
CREATE TABLE IF NOT EXISTS follow_up_messages (
  id TEXT PRIMARY KEY,
  job_id TEXT NOT NULL,
  question TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TEXT NOT NULL,
  FOREIGN KEY (job_id) REFERENCES strategy_jobs(id)
);

-- Session audit (append-only for queryability)
CREATE TABLE IF NOT EXISTS session_audit (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  action TEXT NOT NULL,
  patch_json TEXT,
  created_at TEXT NOT NULL
);
