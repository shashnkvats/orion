-- Migration: Add users table for email/password authentication
-- Run this in your PostgreSQL database

CREATE TABLE IF NOT EXISTS orion.users (
    user_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for email lookups (login)
CREATE INDEX IF NOT EXISTS idx_users_email ON orion.users(email);

-- Optional: Add user_id foreign key to conversation_threads if not exists
-- ALTER TABLE orion.conversation_threads 
--     ADD CONSTRAINT fk_user_id 
--     FOREIGN KEY (user_id) REFERENCES orion.users(user_id);

