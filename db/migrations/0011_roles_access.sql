-- 0011_roles_access: HR role + least-privilege menus per role.
-- Owner (admin) sees company overview, not HR. super_admin still sees everything.
INSERT INTO roles (name, permissions)
VALUES ('hr', '["hr.*","projects.read","operations.read","chat.read"]')
ON CONFLICT (name) DO UPDATE SET permissions = EXCLUDED.permissions;

UPDATE roles SET permissions = '["projects.*","finance.*","bills.*","operations.*","fleet.*","masters.*","chat.read"]'
WHERE name = 'admin';

UPDATE roles SET permissions = '["finance.*","bills.*","projects.read","masters.read","chat.read"]'
WHERE name = 'accountant';

UPDATE roles SET permissions = '["operations.*","projects.read","hr.attendance","chat.read"]'
WHERE name = 'foreman';
