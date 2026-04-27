-- Local-dev seed data for couples-scrapbook
-- Idempotent: safe to re-run.

INSERT INTO couples (id, invite_code) VALUES
  ('11111111-1111-1111-1111-111111111111', 'WELCOME1')
  ON CONFLICT (invite_code) DO NOTHING;

INSERT INTO users (id, entra_object_id, email, display_name, couple_id) VALUES
  ('22222222-2222-2222-2222-222222222222', 'dev-oid-alice', 'alice@example.com', 'Alice',  '11111111-1111-1111-1111-111111111111'),
  ('33333333-3333-3333-3333-333333333333', 'dev-oid-bob',   'bob@example.com',   'Bob',    '11111111-1111-1111-1111-111111111111')
  ON CONFLICT (entra_object_id) DO NOTHING;
