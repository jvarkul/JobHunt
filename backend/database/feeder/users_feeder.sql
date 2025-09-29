-- Users table sample data
-- Insert test users for development and testing

INSERT INTO users (email, password) VALUES
    ('john.doe@email.com', '$2b$10$example.hashed.password.here'),
    ('jane.smith@email.com', '$2b$10$example.hashed.password.here'),
    ('mike.johnson@email.com', '$2b$10$example.hashed.password.here'),
    ('sarah.wilson@email.com', '$2b$10$example.hashed.password.here'),
    ('david.brown@email.com', '$2b$10$example.hashed.password.here');

-- Note: In production, passwords should be properly hashed using bcrypt or similar
-- The above are example hashed password placeholders