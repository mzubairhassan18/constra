-- 0012_client_link: scope projects to a client login + client<->company messages
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS client_user_id UUID REFERENCES users(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS projects_client_user_idx ON projects(client_user_id);

CREATE TABLE IF NOT EXISTS client_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) BETWEEN 1 AND 2000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS client_messages_project_idx ON client_messages(project_id);
