-- 0008_portal: per-project shareable client links with visibility flags
CREATE TABLE portal_tokens (
  token TEXT PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  show_costs BOOLEAN NOT NULL DEFAULT FALSE,
  show_photos BOOLEAN NOT NULL DEFAULT TRUE,
  show_delays BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
