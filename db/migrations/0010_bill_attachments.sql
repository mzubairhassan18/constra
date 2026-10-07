-- 0010_bill_attachments: receipt/photo attachments for supplier bills (R2 bills/ prefix)
CREATE TABLE IF NOT EXISTS bill_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bill_id UUID NOT NULL REFERENCES bills(id) ON DELETE CASCADE,
  r2_key TEXT NOT NULL,
  mime TEXT NOT NULL DEFAULT 'application/octet-stream',
  size INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS bill_images_bill_idx ON bill_images(bill_id);
