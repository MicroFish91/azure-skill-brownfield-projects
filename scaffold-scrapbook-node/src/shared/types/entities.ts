export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  coupleId: string | null;
  createdAt: string;
  updatedAt: string;
}

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
  status: CoupleStatus;
  createdAt: string;
  updatedAt: string;
}

export type CoupleStatus = 'pending' | 'accepted' | 'declined';

export interface Photo {
  id: string;
  coupleId: string;
  uploadedBy: string;
  blobUrl: string;
  caption: string;
  createdAt: string;
  updatedAt: string;
}
