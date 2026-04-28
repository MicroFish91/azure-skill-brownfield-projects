import type { Photo } from '@app/shared';
import type { ServiceContainer } from '../services/registry.js';

/** Convert a stored photo row + signed-URL lookup into the public Photo shape. */
export async function toPublicPhoto(
  services: ServiceContainer,
  row: Omit<Photo, 'url'>
): Promise<Photo> {
  const url = await services.blob.getReadUrl(row.blobPath);
  return { ...row, url };
}
