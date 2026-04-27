// Domain entities. These shapes are what the API returns to clients.

export interface User {
  id: string;
  entraObjectId: string;
  email: string;
  displayName: string;
  coupleId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Couple {
  id: string;
  inviteCode: string;
  createdAt: string;
  updatedAt: string;
  members: Array<Pick<User, 'id' | 'displayName' | 'email'>>;
}

export interface Photo {
  id: string;
  coupleId: string;
  uploaderId: string | null;
  blobPath: string;
  contentType: string;
  caption: string;
  captionSource: 'ai' | 'fallback';
  url: string; // signed URL for display
  createdAt: string;
}
