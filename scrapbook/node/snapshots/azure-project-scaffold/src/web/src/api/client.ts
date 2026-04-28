/**
 * Typed API client.
 *
 * In preview mode (VITE_USE_MOCK_API !== 'false'), this serves an
 * in-memory mock so the UI is fully interactive without a backend.
 * Step 11 keeps the same surface but routes to /api/* against the
 * real Functions host.
 */

import type {
  Couple,
  CoupleResponse,
  HealthResponse,
  MeResponse,
  Photo,
  PhotoListResponse,
  PhotoResponse
} from '@app/shared';

export interface ApiClient {
  health(): Promise<HealthResponse>;
  me(): Promise<MeResponse>;
  getCouple(): Promise<CoupleResponse>;
  pairCouple(inviteCode: string): Promise<CoupleResponse>;
  listPhotos(): Promise<PhotoListResponse>;
  uploadPhoto(file: File): Promise<PhotoResponse>;
  deletePhoto(id: string): Promise<void>;
}

const USE_MOCK = import.meta.env.VITE_USE_MOCK_API !== 'false';

// ---------- Mock implementation (preview mode) ----------

function nowIso() { return new Date().toISOString(); }

const MOCK_COUPLE: Couple = {
  id: 'preview-couple-1',
  inviteCode: 'PREVIEW1',
  createdAt: nowIso(),
  updatedAt: nowIso(),
  members: [
    { id: 'preview-user-1', displayName: 'Alex', email: 'alex@example.com' },
    { id: 'preview-user-2', displayName: 'Sam',  email: 'sam@example.com'  }
  ]
};

const MOCK_PHOTOS: Photo[] = [
  {
    id: 'p1', coupleId: 'preview-couple-1', uploaderId: 'preview-user-1',
    blobPath: 'mock/p1', contentType: 'image/jpeg',
    caption: 'Sun-soaked picnic at the lake',
    captionSource: 'ai',
    url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800',
    createdAt: nowIso()
  },
  {
    id: 'p2', coupleId: 'preview-couple-1', uploaderId: 'preview-user-2',
    blobPath: 'mock/p2', contentType: 'image/jpeg',
    caption: 'First snow together ❄️',
    captionSource: 'ai',
    url: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800',
    createdAt: nowIso()
  },
  {
    id: 'p3', coupleId: 'preview-couple-1', uploaderId: 'preview-user-1',
    blobPath: 'mock/p3', contentType: 'image/jpeg',
    caption: 'Coffee shop afternoon',
    captionSource: 'fallback',
    url: 'https://images.unsplash.com/photo-1497515114629-f71d768fd07c?w=800',
    createdAt: nowIso()
  }
];

const FALLBACK_CAPTIONS = [
  'A new memory ✨',
  'Together moments',
  'Just us, again',
  'Worth keeping forever'
];

class MockClient implements ApiClient {
  private photos: Photo[] = [...MOCK_PHOTOS];
  private nextId = 100;

  async health(): Promise<HealthResponse> {
    return {
      status: 'healthy',
      services: {
        postgres: { status: 'healthy' },
        blob: { status: 'healthy' },
        captions: { status: 'healthy' }
      }
    };
  }
  async me(): Promise<MeResponse> {
    return {
      user: {
        id: 'preview-user-1',
        entraObjectId: 'preview-oid',
        email: 'alex@example.com',
        displayName: 'Alex (preview)',
        coupleId: 'preview-couple-1',
        createdAt: nowIso(), updatedAt: nowIso()
      }
    };
  }
  async getCouple(): Promise<CoupleResponse> { return { couple: MOCK_COUPLE }; }
  async pairCouple(_inviteCode: string): Promise<CoupleResponse> { return { couple: MOCK_COUPLE }; }
  async listPhotos(): Promise<PhotoListResponse> { return { photos: this.photos }; }
  async uploadPhoto(file: File): Promise<PhotoResponse> {
    const url = URL.createObjectURL(file);
    const id = `mock-${this.nextId++}`;
    const caption =
      FALLBACK_CAPTIONS[Math.floor(Math.random() * FALLBACK_CAPTIONS.length)];
    const photo: Photo = {
      id, coupleId: 'preview-couple-1', uploaderId: 'preview-user-1',
      blobPath: `mock/${id}`, contentType: file.type || 'image/jpeg',
      caption, captionSource: 'ai', url, createdAt: nowIso()
    };
    this.photos = [photo, ...this.photos];
    return { photo };
  }
  async deletePhoto(id: string): Promise<void> {
    this.photos = this.photos.filter((p) => p.id !== id);
  }
}

// ---------- Real HTTP implementation (Step 11) ----------

class HttpClient implements ApiClient {
  constructor(private readonly getToken: () => Promise<string | null>) {}

  private async authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
    const token = await this.getToken();
    const headers = new Headers(init.headers);
    if (token) headers.set('authorization', `Bearer ${token}`);
    const res = await fetch(path, { ...init, headers });
    if (!res.ok && res.status !== 204) {
      const text = await res.text().catch(() => res.statusText);
      throw new Error(`API ${res.status}: ${text}`);
    }
    return res;
  }

  async health() { return (await this.authedFetch('/api/health')).json() as Promise<HealthResponse>; }
  async me()     { return (await this.authedFetch('/api/me')).json()     as Promise<MeResponse>; }
  async getCouple() { return (await this.authedFetch('/api/couple')).json() as Promise<CoupleResponse>; }
  async pairCouple(inviteCode: string) {
    return (
      await this.authedFetch('/api/couple/pair', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ inviteCode })
      })
    ).json() as Promise<CoupleResponse>;
  }
  async listPhotos() { return (await this.authedFetch('/api/photos')).json() as Promise<PhotoListResponse>; }
  async uploadPhoto(file: File) {
    const form = new FormData();
    form.append('file', file);
    return (await this.authedFetch('/api/photos', { method: 'POST', body: form })).json() as Promise<PhotoResponse>;
  }
  async deletePhoto(id: string) {
    await this.authedFetch(`/api/photos/${id}`, { method: 'DELETE' });
  }
}

let _client: ApiClient | null = null;

export function getClient(getToken?: () => Promise<string | null>): ApiClient {
  if (!_client) {
    _client = USE_MOCK ? new MockClient() : new HttpClient(getToken ?? (async () => null));
  }
  return _client;
}

export function resetClientForTesting(): void { _client = null; }

export const __test = { MockClient, HttpClient };
