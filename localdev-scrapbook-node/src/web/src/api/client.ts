const API_BASE = '/api';

interface RequestOptions {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
  formData?: FormData;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, headers = {}, formData } = options;
  const token = localStorage.getItem('token');

  const reqHeaders: Record<string, string> = {
    ...headers,
  };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  const fetchOptions: RequestInit = {
    method,
    headers: reqHeaders,
  };

  if (formData) {
    fetchOptions.body = formData;
  } else if (body) {
    reqHeaders['Content-Type'] = 'application/json';
    fetchOptions.headers = reqHeaders;
    fetchOptions.body = JSON.stringify(body);
  }

  const response = await fetch(`${API_BASE}${path}`, fetchOptions);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({
      error: { code: 'INTERNAL_ERROR', message: 'An unexpected error occurred', details: null },
    }));
    const err = new Error(errorData.error?.message || 'Request failed') as Error & {
      status: number;
      code: string;
    };
    err.status = response.status;
    err.code = errorData.error?.code || 'INTERNAL_ERROR';
    throw err;
  }

  return response.json();
}

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  coupleId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  user: PublicUser;
  token: string;
}

export interface Photo {
  id: string;
  coupleId: string;
  uploadedByUserId: string;
  blobUrl: string;
  caption: string;
  createdAt: string;
  updatedAt: string;
}

export interface Invite {
  id: string;
  fromUserId: string;
  toEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface Couple {
  id: string;
  createdAt: string;
  updatedAt: string;
}

export const api = {
  register: (data: { email: string; password: string; displayName: string }) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: data }),

  login: (data: { email: string; password: string }) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: data }),

  getMe: () => request<{ user: PublicUser }>('/auth/me'),

  createInvite: (toEmail: string) =>
    request<{ invite: Invite }>('/invites', { method: 'POST', body: { toEmail } }),

  listInvites: (type?: 'sent' | 'received') =>
    request<{ invites: Invite[]; total: number }>(`/invites${type ? `?type=${type}` : ''}`),

  acceptInvite: (id: string) =>
    request<{ couple: Couple }>(`/invites/${id}/accept`, { method: 'POST' }),

  getCouple: () =>
    request<{ couple: Couple & { partner: PublicUser } }>('/couple'),

  uploadPhoto: (file: File, caption?: string) => {
    const formData = new FormData();
    formData.append('file', file);
    if (caption) formData.append('caption', caption);
    return request<{ photo: Photo }>('/photos', { method: 'POST', formData });
  },

  listPhotos: (limit = 20, offset = 0) =>
    request<{ photos: Photo[]; total: number }>(`/photos?limit=${limit}&offset=${offset}`),

  getPhoto: (id: string) => request<{ photo: Photo }>(`/photos/${id}`),

  deletePhoto: (id: string) =>
    request<{ success: boolean }>(`/photos/${id}`, { method: 'DELETE' }),
};
