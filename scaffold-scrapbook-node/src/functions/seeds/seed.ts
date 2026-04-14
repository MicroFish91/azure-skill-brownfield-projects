import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const seedData = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'seed-data.json'), 'utf-8'));

async function seed() {
  const connectionString = process.env.DATABASE_URL ?? 'postgresql://localdev:localdevpassword@localhost:5432/scrapbookdb';
  const pool = new pg.Pool({ connectionString });

  try {
    // Run migration first
    const migrationSql = fs.readFileSync(path.join(__dirname, 'migration.sql'), 'utf-8');
    await pool.query(migrationSql);
    console.log('Migration applied successfully');

    // Seed couples first (no FK deps on users yet)
    for (const couple of seedData.couples) {
      await pool.query(
        `INSERT INTO couples (id, user1_id, user2_id, status, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT (id) DO NOTHING`,
        [couple.id, couple.user1Id, couple.user2Id, couple.status, couple.createdAt, couple.updatedAt]
      );
    }

    // Seed users
    for (const user of seedData.users) {
      await pool.query(
        `INSERT INTO users (id, email, password_hash, display_name, couple_id, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
        [user.id, user.email, user.passwordHash, user.displayName, user.coupleId, user.createdAt, user.updatedAt]
      );
    }

    // Seed photos
    for (const photo of seedData.photos) {
      await pool.query(
        `INSERT INTO photos (id, couple_id, uploaded_by, blob_url, caption, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (id) DO NOTHING`,
        [photo.id, photo.coupleId, photo.uploadedBy, photo.blobUrl, photo.caption, photo.createdAt, photo.updatedAt]
      );
    }

    console.log('Seed data inserted successfully');
  } catch (error) {
    console.error('Seed failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seed();
