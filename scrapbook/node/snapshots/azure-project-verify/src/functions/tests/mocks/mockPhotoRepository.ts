import { randomUUID } from 'node:crypto';
import type { Photo } from '@app/shared';
import type { CreatePhotoInput, IPhotoRepository } from '../../src/services/interfaces/IPhotoRepository.js';

type StoredPhoto = Omit<Photo, 'url'>;

export class MockPhotoRepository implements IPhotoRepository {
  public photos = new Map<string, StoredPhoto>();

  async create(input: CreatePhotoInput): Promise<StoredPhoto> {
    const photo: StoredPhoto = {
      id: randomUUID(),
      coupleId: input.coupleId,
      uploaderId: input.uploaderId,
      blobPath: input.blobPath,
      contentType: input.contentType,
      caption: input.caption,
      captionSource: input.captionSource,
      createdAt: new Date().toISOString()
    };
    this.photos.set(photo.id, photo);
    return { ...photo };
  }

  async findById(id: string): Promise<StoredPhoto | null> {
    const p = this.photos.get(id);
    return p ? { ...p } : null;
  }

  async listByCoupleId(coupleId: string): Promise<StoredPhoto[]> {
    return [...this.photos.values()]
      .filter((p) => p.coupleId === coupleId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
      .map((p) => ({ ...p }));
  }

  async delete(id: string): Promise<void> {
    this.photos.delete(id);
  }

  // --- helpers ---
  seed(photo: StoredPhoto): StoredPhoto {
    this.photos.set(photo.id, { ...photo });
    return { ...photo };
  }
}
