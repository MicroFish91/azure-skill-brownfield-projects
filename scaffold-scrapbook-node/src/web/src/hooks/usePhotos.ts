import { useState, useEffect, useCallback } from 'react';
import type { Photo } from 'scrapbook-shared';
import { api } from '../api/client.ts';

export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPhotos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.listPhotos();
      setPhotos(result.photos);
      setTotal(result.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPhotos();
  }, [fetchPhotos]);

  const uploadPhoto = useCallback(async (file: File) => {
    setError(null);
    try {
      const result = await api.uploadPhoto(file);
      setPhotos((prev) => [result.photo, ...prev]);
      setTotal((prev) => prev + 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload photo');
      throw err;
    }
  }, []);

  const deletePhoto = useCallback(async (id: string) => {
    const previousPhotos = photos;
    const previousTotal = total;
    setPhotos((prev) => prev.filter((p) => p.id !== id));
    setTotal((prev) => prev - 1);
    try {
      await api.deletePhoto(id);
    } catch (err) {
      setPhotos(previousPhotos);
      setTotal(previousTotal);
      setError(err instanceof Error ? err.message : 'Failed to delete photo');
    }
  }, [photos, total]);

  return { photos, total, loading, error, uploadPhoto, deletePhoto, refetch: fetchPhotos };
}
