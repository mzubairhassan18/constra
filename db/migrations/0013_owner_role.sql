-- 0013_owner_role: company owner = read-only overview, no HR, no user admin.
-- super_admin stays the all-powerful IT role; `admin` remains for office managers.
INSERT INTO roles (name, permissions)
VALUES ('owner', '["projects.read","bills.read","finance.read","operations.read","chat.read"]')
ON CONFLICT (name) DO UPDATE SET permissions = EXCLUDED.permissions;
