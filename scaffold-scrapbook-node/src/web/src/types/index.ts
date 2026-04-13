export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  coupleId: string | null;
  createdAt: string;
}

export interface Couple {
  id: string;
  user1Id: string;
  user2Id: string;
  status: 'pending' | 'accepted' | 'declined';
  createdAt: string;
  updatedAt: string;
}

export interface Photo {
  id: string;
  coupleId: string;
  uploadedBy: string;
  blobUrl: string;
  caption: string;
  createdAt: string;
  updatedAt: string;
}

export interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}
