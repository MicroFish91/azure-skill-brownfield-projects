import { useCallback, useEffect, useState } from 'react';
import type { Photo } from '@app/shared';
import { getClient } from '../api/client.js';

export type PhotosState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'empty' }
  | { status: 'data'; photos: Photo[] };

export function usePhotos() {
  const [state, setState] = useState<PhotosState>({ status: 'loading' });

  const reload = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const { photos } = await getClient().listPhotos();
      setState(photos.length === 0 ? { status: 'empty' } : { status: 'data', photos });
    } catch (err) {
      setState({ status: 'error', message: (err as Error).message });
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const upload = useCallback(async (file: File) => {
    const previous = state;
    try {
      const { photo } = await getClient().uploadPhoto(file);
      setState((prev) =>
        prev.status === 'data'
          ? { status: 'data', photos: [photo, ...prev.photos] }
          : { status: 'data', photos: [photo] }
      );
    } catch (err) {
      setState(previous);
      throw err;
    }
  }, [state]);

  const remove = useCallback(async (id: string) => {
    if (state.status !== 'data') return;
    const previous = state;
    setState({
      status: 'data',
      photos: state.photos.filter((p) => p.id !== id)
    });
    try {
      await getClient().deletePhoto(id);
      // If we just emptied the list, transition to empty.
      setState((prev) =>
        prev.status === 'data' && prev.photos.length === 0 ? { status: 'empty' } : prev
      );
    } catch (err) {
      setState(previous);
      throw err;
    }
  }, [state]);

  return { state, reload, upload, remove };
}
