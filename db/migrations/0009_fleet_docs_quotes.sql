-- 0009_fleet_docs_quotes: vehicles, site documents, quotations
CREATE TABLE IF NOT EXISTS vehicles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plate_no TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  mulkia_expiry DATE,
  insurance_expiry DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS vehicle_maintenance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  cost NUMERIC(12,2) NOT NULL CHECK (cost >= 0),
  description TEXT
);

CREATE TABLE IF NOT EXISTS vehicle_fines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id UUID NOT NULL REFERENCES vehicles(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  reason TEXT,
  driver TEXT
);

CREATE TABLE IF NOT EXISTS site_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  r2_key TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1 CHECK (version >= 1),
  uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quotations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_name TEXT NOT NULL,
  project_name TEXT,
  date DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft','sent','accepted','rejected')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_maintenance_vehicle ON vehicle_maintenance(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_fines_vehicle ON vehicle_fines(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_site_documents_project ON site_documents(project_id);
CREATE INDEX IF NOT EXISTS idx_quotations_status ON quotations(status);
