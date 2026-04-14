import type {
  AuthResponse,
  MeResponse,
  CoupleResponse,
  CoupleDetailResponse,
  PhotoResponse,
  ListPhotosResponse,
  SuccessResponse,
  ErrorResponse,
  LoginRequest,
  RegisterRequest,
  CreateCoupleRequest,
} from 'scrapbook-shared';

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(method: string, path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token) headers['Authorization'] = `Bearer ${token}`;
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`/api${path}`, { ...options, method, headers });

  if (!res.ok) {
    const errorBody: ErrorResponse = await res.json();
    throw new ApiError(res.status, errorBody.error.code, errorBody.error.message);
  }

  return res.json() as Promise<T>;
}

export const api = {
  login: (data: LoginRequest) =>
    request<AuthResponse>('POST', '/auth/login', { body: JSON.stringify(data) }),

  register: (data: RegisterRequest) =>
    request<AuthResponse>('POST', '/auth/register', { body: JSON.stringify(data) }),

  getMe: () =>
    request<MeResponse>('GET', '/auth/me'),

  createCouple: (data: CreateCoupleRequest) =>
    request<CoupleResponse>('POST', '/couples', { body: JSON.stringify(data) }),

  getCouple: (id: string) =>
    request<CoupleDetailResponse>('GET', `/couples/${id}`),

  acceptCouple: (id: string) =>
    request<CoupleResponse>('POST', `/couples/${id}/accept`),

  listPhotos: (limit = 20, offset = 0) =>
    request<ListPhotosResponse>('GET', `/photos?limit=${limit}&offset=${offset}`),

  getPhoto: (id: string) =>
    request<PhotoResponse>('GET', `/photos/${id}`),

  uploadPhoto: (file: File) => {
    const form = new FormData();
    form.append('file', file);
    return request<PhotoResponse>('POST', '/photos', { body: form });
  },

  deletePhoto: (id: string) =>
    request<SuccessResponse>('DELETE', `/photos/${id}`),
};
