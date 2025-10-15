-- Task Manager Database Seed Data
-- PostgreSQL

-- Note: Passwords are hashed with bcrypt (password: "password123")
-- You can generate new hashes using: bcrypt.hash('your-password', 10)

-- Insert test users
INSERT INTO users (id, email, password, name, created_at, updated_at) VALUES
    ('550e8400-e29b-41d4-a716-446655440001', 'demo@example.com', '$2b$10$FsIQ0YwDo1Xb3H9nUQxPTOcY7URtXsuagEaDB6Emcl7BKH3oWxxhu', 'Demo User', NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440002', 'jane.smith@example.com', '$2b$10$FsIQ0YwDo1Xb3H9nUQxPTOcY7URtXsuagEaDB6Emcl7BKH3oWxxhu', 'Jane Smith', NOW(), NOW()),
    ('550e8400-e29b-41d4-a716-446655440003', 'bob.wilson@example.com', '$2b$10$FsIQ0YwDo1Xb3H9nUQxPTOcY7URtXsuagEaDB6Emcl7BKH3oWxxhu', 'Bob Wilson', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- Insert test tasks for Demo User
INSERT INTO tasks (title, description, completed, user_id, created_at, updated_at) VALUES
    ('Completar proyecto de NestJS', 'Terminar el backend del task manager con autenticación JWT', false, '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
    ('Revisar documentación de TypeORM', 'Leer sobre relaciones y migraciones', false, '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
    ('Comprar víveres', 'Hacer la compra del supermercado', true, '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW()),
    ('Llamar al dentista', 'Agendar cita para limpieza dental', false, '550e8400-e29b-41d4-a716-446655440001', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert test tasks for Jane Smith
INSERT INTO tasks (title, description, completed, user_id, created_at, updated_at) VALUES
    ('Preparar presentación', 'Crear slides para la reunión del viernes', false, '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('Hacer ejercicio', 'Ir al gimnasio por la tarde', true, '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW()),
    ('Leer libro de Flutter', 'Continuar leyendo el capítulo sobre Bloc pattern', false, '550e8400-e29b-41d4-a716-446655440002', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Insert test tasks for Bob Wilson
INSERT INTO tasks (title, description, completed, user_id, created_at, updated_at) VALUES
    ('Revisar código del equipo', 'Code review de los pull requests pendientes', false, '550e8400-e29b-41d4-a716-446655440003', NOW(), NOW()),
    ('Actualizar dependencias', 'Actualizar packages de npm a las últimas versiones', false, '550e8400-e29b-41d4-a716-446655440003', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- Display summary
SELECT 'Seed data inserted successfully!' as message;
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_tasks FROM tasks;

