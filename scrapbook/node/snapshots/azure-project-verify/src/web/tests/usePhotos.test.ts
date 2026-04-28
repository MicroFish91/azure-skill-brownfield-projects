import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { usePhotos } from '../src/hooks/usePhotos.js';
import { resetClientForTesting } from '../src/api/client.js';

function jpegFile() {
  return new File([new Uint8Array([0xff, 0xd8, 0xff])], 'p.jpg', { type: 'image/jpeg' });
}

describe('usePhotos (mock client)', () => {
  beforeEach(() => {
    resetClientForTesting();
  });

  it('loads photos and exposes data state', async () => {
    const { result } = renderHook(() => usePhotos());
    await waitFor(() =>
      expect(['data', 'empty']).toContain(result.current.state.status)
    );
    if (result.current.state.status === 'data') {
      expect(result.current.state.photos.length).toBeGreaterThan(0);
    }
  });

  it('upload prepends the new photo into data state', async () => {
    const { result } = renderHook(() => usePhotos());
    await waitFor(() => expect(result.current.state.status).toBe('data'));
    const before =
      result.current.state.status === 'data' ? result.current.state.photos.length : 0;

    await act(async () => { await result.current.upload(jpegFile()); });

    expect(result.current.state.status).toBe('data');
    if (result.current.state.status === 'data') {
      expect(result.current.state.photos.length).toBe(before + 1);
    }
  });

  it('remove deletes the photo from state', async () => {
    const { result } = renderHook(() => usePhotos());
    await waitFor(() => expect(result.current.state.status).toBe('data'));

    const target =
      result.current.state.status === 'data' ? result.current.state.photos[0].id : '';
    await act(async () => { await result.current.remove(target); });

    if (result.current.state.status === 'data') {
      expect(result.current.state.photos.find((p) => p.id === target)).toBeUndefined();
    }
  });
});
