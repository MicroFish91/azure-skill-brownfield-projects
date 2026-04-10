import { useState, useCallback, useEffect } from 'react';
import { api, type Photo } from '../api/client';

export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPhotos = useCallback(async (limit = 20, offset = 0) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.listPhotos(limit, offset);
      setPhotos(res.photos);
      setTotal(res.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPhotos();
  }, [loadPhotos]);

  const uploadPhoto = useCallback(async (file: File, caption?: string) => {
    try {
      const res = await api.uploadPhoto(file, caption);
      setPhotos((prev) => [res.photo, ...prev]);
      setTotal((prev) => prev + 1);
      return res.photo;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
      throw err;
    }
  }, []);

  const deletePhoto = useCallback(async (id: string) => {
    const prev = photos;
    setPhotos((current) => current.filter((p) => p.id !== id));
    setTotal((t) => t - 1);
    try {
      await api.deletePhoto(id);
    } catch (err: unknown) {
      setPhotos(prev);
      setTotal((t) => t + 1);
      setError(err instanceof Error ? err.message : 'Failed to delete photo');
      throw err;
    }
  }, [photos]);

  return { photos, total, loading, error, loadPhotos, uploadPhoto, deletePhoto };
}
