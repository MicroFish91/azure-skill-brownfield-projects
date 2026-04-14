import type { PublicUser, Couple, Photo } from '../types/index.ts';

export const mockUser: PublicUser = {
  id: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  email: 'alice@example.com',
  displayName: 'Alice',
  coupleId: 'c1d2e3f4-a5b6-7890-cdef-123456789abc',
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const mockPartner: PublicUser = {
  id: 'b2c3d4e5-f6a7-8901-bcde-f12345678901',
  email: 'bob@example.com',
  displayName: 'Bob',
  coupleId: 'c1d2e3f4-a5b6-7890-cdef-123456789abc',
  createdAt: '2026-01-01T00:00:00.000Z',
};

export const mockCouple: Couple = {
  id: 'c1d2e3f4-a5b6-7890-cdef-123456789abc',
  user1Id: mockUser.id,
  user2Id: mockPartner.id,
  status: 'accepted',
  createdAt: '2026-01-02T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

export const mockPhotos: Photo[] = [
  {
    id: 'd1e2f3a4-b5c6-7890-defa-bcdef1234567',
    coupleId: mockCouple.id,
    uploadedBy: mockUser.id,
    blobUrl: 'https://picsum.photos/seed/scrapbook1/400/300',
    caption: 'Our first adventure together!',
    createdAt: '2026-01-15T10:30:00.000Z',
    updatedAt: '2026-01-15T10:30:00.000Z',
  },
  {
    id: 'e2f3a4b5-c6d7-8901-efab-cdef12345678',
    coupleId: mockCouple.id,
    uploadedBy: mockPartner.id,
    blobUrl: 'https://picsum.photos/seed/scrapbook2/400/300',
    caption: 'Sunset at the beach',
    createdAt: '2026-02-14T18:00:00.000Z',
    updatedAt: '2026-02-14T18:00:00.000Z',
  },
  {
    id: 'f3a4b5c6-d7e8-9012-fabc-def123456789',
    coupleId: mockCouple.id,
    uploadedBy: mockUser.id,
    blobUrl: 'https://picsum.photos/seed/scrapbook3/400/300',
    caption: 'Cooking dinner together',
    createdAt: '2026-03-01T19:00:00.000Z',
    updatedAt: '2026-03-01T19:00:00.000Z',
  },
  {
    id: 'a4b5c6d7-e8f9-0123-abcd-ef1234567890',
    coupleId: mockCouple.id,
    uploadedBy: mockPartner.id,
    blobUrl: 'https://picsum.photos/seed/scrapbook4/400/300',
    caption: 'Hiking in the mountains',
    createdAt: '2026-03-15T12:00:00.000Z',
    updatedAt: '2026-03-15T12:00:00.000Z',
  },
  {
    id: 'b5c6d7e8-f9a0-1234-bcde-f12345678901',
    coupleId: mockCouple.id,
    uploadedBy: mockUser.id,
    blobUrl: 'https://picsum.photos/seed/scrapbook5/400/300',
    caption: 'Date night at our favorite restaurant',
    createdAt: '2026-04-01T20:00:00.000Z',
    updatedAt: '2026-04-01T20:00:00.000Z',
  },
  {
    id: 'c6d7e8f9-a0b1-2345-cdef-123456789abc',
    coupleId: mockCouple.id,
    uploadedBy: mockPartner.id,
    blobUrl: 'https://picsum.photos/seed/scrapbook6/400/300',
    caption: 'Weekend getaway vibes',
    createdAt: '2026-04-10T14:00:00.000Z',
    updatedAt: '2026-04-10T14:00:00.000Z',
  },
];
