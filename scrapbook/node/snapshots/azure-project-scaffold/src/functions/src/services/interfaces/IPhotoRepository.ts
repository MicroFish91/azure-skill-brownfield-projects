import type { Photo } from '@app/shared';

export interface CreatePhotoInput {
  coupleId: string;
  uploaderId: string;
  blobPath: string;
  contentType: string;
  caption: string;
  captionSource: 'ai' | 'fallback';
}

export interface IPhotoRepository {
  create(input: CreatePhotoInput): Promise<Omit<Photo, 'url'>>;
  findById(id: string): Promise<Omit<Photo, 'url'> | null>;
  listByCoupleId(coupleId: string): Promise<Array<Omit<Photo, 'url'>>>;
  delete(id: string): Promise<void>;
}
