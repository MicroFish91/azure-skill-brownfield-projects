-- Initial schema for couples-scrapbook
-- Tables: users, couples, photos

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS couples (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_code  TEXT NOT NULL UNIQUE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entra_object_id TEXT NOT NULL UNIQUE,
  email           TEXT NOT NULL UNIQUE,
  display_name    TEXT NOT NULL,
  couple_id       UUID REFERENCES couples(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_couple_id ON users(couple_id);

-- Caption source enum-like column — enforced via CHECK to avoid migration friction.
CREATE TABLE IF NOT EXISTS photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_id       UUID NOT NULL REFERENCES couples(id) ON DELETE CASCADE,
  uploader_id     UUID REFERENCES users(id) ON DELETE SET NULL,
  blob_path       TEXT NOT NULL,
  content_type    TEXT NOT NULL,
  caption         TEXT NOT NULL,
  caption_source  TEXT NOT NULL CHECK (caption_source IN ('ai', 'fallback')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_photos_couple_created
  ON photos(couple_id, created_at DESC);

-- Enforce max 2 members per couple via a trigger.
CREATE OR REPLACE FUNCTION enforce_max_two_per_couple()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.couple_id IS NOT NULL THEN
    IF (SELECT COUNT(*) FROM users WHERE couple_id = NEW.couple_id AND id <> NEW.id) >= 2 THEN
      RAISE EXCEPTION 'couple_member_limit: couple % already has 2 members', NEW.couple_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_couple_limit ON users;
CREATE TRIGGER trg_users_couple_limit
  BEFORE INSERT OR UPDATE OF couple_id ON users
  FOR EACH ROW EXECUTE FUNCTION enforce_max_two_per_couple();
