import { describe, it, expect } from 'vitest';
import { __test, resetClientForTesting } from '../src/api/client.js';

describe('MockClient (preview mode)', () => {
  it('returns a healthy status', async () => {
    resetClientForTesting();
    const c = new __test.MockClient();
    const h = await c.health();
    expect(h.status).toBe('healthy');
    expect(h.services.postgres.status).toBe('healthy');
  });

  it('lists photos and supports upload/delete round-trip', async () => {
    const c = new __test.MockClient();
    const before = (await c.listPhotos()).photos.length;

    const file = new File([new Uint8Array([1, 2, 3])], 'x.jpg', { type: 'image/jpeg' });
    const { photo } = await c.uploadPhoto(file);
    expect(photo.id).toMatch(/^mock-/);

    const after = (await c.listPhotos()).photos.length;
    expect(after).toBe(before + 1);

    await c.deletePhoto(photo.id);
    const final = (await c.listPhotos()).photos.length;
    expect(final).toBe(before);
  });

  it('returns the preview couple', async () => {
    const c = new __test.MockClient();
    const { couple } = await c.getCouple();
    expect(couple.members).toHaveLength(2);
  });
});
