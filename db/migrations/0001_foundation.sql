-- 0001_foundation: single-company core (Neon Postgres)
-- No company_id (single company). Auth enforced in app use-case layer.
-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS citext;

-- Roles & permissions (permissions: JSONB array of "module.action")
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  permissions JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username CITEXT UNIQUE NOT NULL,
  email CITEXT UNIQUE,
  password_hash TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role_id UUID REFERENCES roles(id),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Single-row payroll policy (monthly->hourly conversion)
CREATE TABLE payroll_policy (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  monthly_divisor_days NUMERIC NOT NULL DEFAULT 26,
  daily_hours NUMERIC NOT NULL DEFAULT 8,
  overtime_multiplier NUMERIC NOT NULL DEFAULT 1.25,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES users(id),
  kind TEXT NOT NULL CHECK (kind IN ('permanent','daily_wager')),
  name TEXT NOT NULL,
  phone TEXT,
  designation TEXT,
  monthly_salary NUMERIC(14,2),
  hourly_rate NUMERIC(14,2),
  day_rate NUMERIC(14,2),
  joining_date DATE,
  photo_r2_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (
    (kind = 'permanent' AND monthly_salary IS NOT NULL) OR
    (kind = 'daily_wager' AND (hourly_rate IS NOT NULL OR day_rate IS NOT NULL))
  )
);

CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_name TEXT,
  location TEXT,
  agreement_amount NUMERIC(14,2),
  start_date DATE,
  end_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','on_hold','completed','cancelled')),
  portal_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  position INT NOT NULL DEFAULT 0,
  planned_start DATE,
  planned_end DATE,
  actual_start DATE,
  actual_end DATE,
  budget NUMERIC(14,2),
  boq NUMERIC(14,2),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','in_progress','completed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (project_id, position)
);

CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id UUID NOT NULL REFERENCES stages(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo','in_progress','blocked','done')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low','medium','high')),
  assigned_to UUID REFERENCES employees(id),
  due_date DATE,
  delay_reason TEXT,
  position INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Labour allocation history: permanent/daily-wager <-> project/stage
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE RESTRICT,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES stages(id) ON DELETE SET NULL,
  from_date DATE NOT NULL,
  to_date DATE,
  allocation_pct INT NOT NULL DEFAULT 100 CHECK (allocation_pct BETWEEN 1 AND 100),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (to_date IS NULL OR to_date >= from_date)
);
CREATE INDEX assignments_emp_idx ON assignments (employee_id, from_date);
CREATE INDEX assignments_proj_idx ON assignments (project_id, stage_id);

CREATE TABLE audit_log (
  id BIGSERIAL PRIMARY KEY,
  actor_id UUID REFERENCES users(id),
  table_name TEXT NOT NULL,
  row_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('insert','update','delete')),
  diff JSONB,
  at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Seeds
INSERT INTO roles (name, permissions) VALUES
  ('super_admin', '["*"]'),
  ('admin', '["projects.*","hr.*","finance.*","operations.*","masters.*"]'),
  ('foreman', '["operations.report","projects.read","hr.attendance"]'),
  ('accountant', '["finance.*","projects.read","bills.*"]'),
  ('client', '["portal.read"]');

INSERT INTO payroll_policy (id) VALUES (1);
