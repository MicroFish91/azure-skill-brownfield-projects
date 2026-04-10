export interface User {
  id: string;
  email: string;
  passwordHash: string;
  displayName: string;
  coupleId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type PublicUser = Omit<User, 'passwordHash'>;

export interface Couple {
  id: string;
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

export interface Photo {
  id: string;
  coupleId: string;
  uploadedByUserId: string;
  blobUrl: string;
  caption: string;
  createdAt: string;
  updatedAt: string;
}
