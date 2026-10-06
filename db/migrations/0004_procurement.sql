-- 0004_procurement: suppliers, materials, VAT, bills, client billing
CREATE TABLE suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  trn_no TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  unit TEXT,
  avg_rate NUMERIC(14,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE tax_codes (
  code TEXT PRIMARY KEY,
  rate NUMERIC(5,4) NOT NULL,
  description TEXT
);
INSERT INTO tax_codes (code, rate, description) VALUES
  ('standard', 0.05, 'UAE VAT 5%'),
  ('zero', 0, 'Zero-rated'),
  ('exempt', 0, 'Exempt'),
  ('reverse', 0, 'Reverse charge');

CREATE TABLE bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_no TEXT,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  stage_id UUID REFERENCES stages(id) ON DELETE SET NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  net NUMERIC(14,2) NOT NULL,
  vat_in NUMERIC(14,2) NOT NULL DEFAULT 0,
  gross NUMERIC(14,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'posted' CHECK (status IN ('draft','posted','reversed')),
  transaction_id UUID REFERENCES transactions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE bill_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  material_id UUID REFERENCES materials(id) ON DELETE SET NULL,
  description TEXT,
  qty NUMERIC(12,3) NOT NULL CHECK (qty > 0),
  unit_price NUMERIC(14,2) NOT NULL CHECK (unit_price >= 0),
  discount NUMERIC(14,2) NOT NULL DEFAULT 0,
  tax_code TEXT NOT NULL REFERENCES tax_codes(code),
  net NUMERIC(14,2) NOT NULL,
  vat NUMERIC(14,2) NOT NULL
);

CREATE TABLE client_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  stage_id UUID REFERENCES stages(id) ON DELETE SET NULL,
  invoice_no TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  net NUMERIC(14,2) NOT NULL,
  vat_out NUMERIC(14,2) NOT NULL DEFAULT 0,
  gross NUMERIC(14,2) NOT NULL,
  transaction_id UUID REFERENCES transactions(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE client_receipts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES client_invoices(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  amount NUMERIC(14,2) NOT NULL CHECK (amount > 0),
  method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Base chart of accounts (control accounts; stage/supplier sub-accounts created on demand)
INSERT INTO accounts (code, name, type, category) VALUES
  ('1000', 'Cash', 'asset', 'Cash'),
  ('1100', 'Client Receivable', 'asset', 'Receivables'),
  ('1400', 'VAT In (recoverable)', 'asset', 'Tax'),
  ('2000', 'Supplier Payable', 'liability', 'Payables'),
  ('2100', 'VAT Out (payable)', 'liability', 'Tax'),
  ('4000', 'Client Revenue', 'revenue', 'Sales'),
  ('5000', 'Project Expenses', 'expense', 'Direct costs');
