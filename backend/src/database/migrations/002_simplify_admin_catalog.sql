-- Simplifica o banco para catalogo publico e administracao interna.
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS favorites;

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_admin_check;
UPDATE users SET role = 'admin' WHERE role IS DISTINCT FROM 'admin';
ALTER TABLE users ALTER COLUMN role SET DEFAULT 'admin';
ALTER TABLE users ADD CONSTRAINT users_role_admin_check CHECK (role = 'admin');
