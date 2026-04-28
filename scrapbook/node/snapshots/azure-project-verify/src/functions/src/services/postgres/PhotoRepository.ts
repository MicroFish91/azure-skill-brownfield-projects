import type { Photo } from '@app/shared';
import type { AppConfig } from '../config.js';
import type { CreatePhotoInput, IPhotoRepository } from '../interfaces/IPhotoRepository.js';
import { withClient } from './pool.js';

interface PhotoRow {
  id: string;
  couple_id: string;
  uploader_id: string | null;
  blob_path: string;
  content_type: string;
  caption: string;
  caption_source: 'ai' | 'fallback';
  created_at: Date;
}

function mapRow(row: PhotoRow): Omit<Photo, 'url'> {
  return {
    id: row.id,
    coupleId: row.couple_id,
    uploaderId: row.uploader_id,
    blobPath: row.blob_path,
    contentType: row.content_type,
    caption: row.caption,
    captionSource: row.caption_source,
    createdAt: row.created_at.toISOString()
  };
}

export class PostgresPhotoRepository implements IPhotoRepository {
  constructor(private readonly config: AppConfig) {}

  async create(input: CreatePhotoInput): Promise<Omit<Photo, 'url'>> {
    return withClient(this.config, async (c) => {
      const r = await c.query<PhotoRow>(
        `INSERT INTO photos (couple_id, uploader_id, blob_path, content_type, caption, caption_source)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [
          input.coupleId,
          input.uploaderId,
          input.blobPath,
          input.contentType,
          input.caption,
          input.captionSource
        ]
      );
      return mapRow(r.rows[0]);
    });
  }

  async findById(id: string): Promise<Omit<Photo, 'url'> | null> {
    return withClient(this.config, async (c) => {
      const r = await c.query<PhotoRow>('SELECT * FROM photos WHERE id = $1', [id]);
      return r.rows[0] ? mapRow(r.rows[0]) : null;
    });
  }

  async listByCoupleId(coupleId: string): Promise<Array<Omit<Photo, 'url'>>> {
    return withClient(this.config, async (c) => {
      const r = await c.query<PhotoRow>(
        'SELECT * FROM photos WHERE couple_id = $1 ORDER BY created_at DESC',
        [coupleId]
      );
      return r.rows.map(mapRow);
    });
  }

  async delete(id: string): Promise<void> {
    await withClient(this.config, async (c) => {
      await c.query('DELETE FROM photos WHERE id = $1', [id]);
    });
  }
}
