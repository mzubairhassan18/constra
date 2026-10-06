-- 0003_attendance: daily hours booked against assignments
CREATE TABLE attendances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  hours NUMERIC(6,2) NOT NULL CHECK (hours >= 0),
  overtime_hours NUMERIC(6,2) NOT NULL DEFAULT 0 CHECK (overtime_hours >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, date)
);
CREATE INDEX attendances_date_idx ON attendances (date);
