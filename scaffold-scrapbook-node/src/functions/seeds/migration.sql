-- Migration: Create initial schema
-- Tables: users, couples, photos

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Couples table (referenced by users)
CREATE TABLE couples (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID NOT NULL,
    user2_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    couple_id UUID REFERENCES couples(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK constraints for couples now that users exists
ALTER TABLE couples ADD CONSTRAINT fk_couples_user1 FOREIGN KEY (user1_id) REFERENCES users(id) ON DELETE CASCADE;
ALTER TABLE couples ADD CONSTRAINT fk_couples_user2 FOREIGN KEY (user2_id) REFERENCES users(id) ON DELETE CASCADE;

-- Photos table
CREATE TABLE photos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    couple_id UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    blob_url TEXT NOT NULL,
    caption TEXT NOT NULL DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_couple_id ON users(couple_id);
CREATE INDEX idx_photos_couple_id ON photos(couple_id);
CREATE INDEX idx_photos_uploaded_by ON photos(uploaded_by);
CREATE INDEX idx_couples_user1_id ON couples(user1_id);
CREATE INDEX idx_couples_user2_id ON couples(user2_id);
