import type { PublicUser, Couple, Photo } from '../types/index.ts';
import { mockUser, mockPartner, mockCouple, mockPhotos } from './data.ts';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

let currentUser: PublicUser | null = mockUser;
let photos = [...mockPhotos];

export const mockApi = {
  login: async (_email: string, _password: string): Promise<{ token: string; user: PublicUser }> => {
    await delay(300);
    currentUser = mockUser;
    return { token: 'mock-jwt-token', user: mockUser };
  },

  register: async (email: string, _password: string, displayName: string): Promise<{ token: string; user: PublicUser }> => {
    await delay(300);
    const newUser: PublicUser = {
      id: crypto.randomUUID(),
      email,
      displayName,
      coupleId: null,
      createdAt: new Date().toISOString(),
    };
    currentUser = newUser;
    return { token: 'mock-jwt-token', user: newUser };
  },

  getMe: async (): Promise<{ user: PublicUser }> => {
    await delay(200);
    if (!currentUser) throw new Error('Not authenticated');
    return { user: currentUser };
  },

  getCouple: async (id: string): Promise<{ couple: Couple; users: PublicUser[] }> => {
    await delay(200);
    if (id === mockCouple.id) {
      return { couple: mockCouple, users: [mockUser, mockPartner] };
    }
    throw new Error('Couple not found');
  },

  listPhotos: async (): Promise<{ photos: Photo[]; total: number }> => {
    await delay(300);
    return { photos, total: photos.length };
  },

  uploadPhoto: async (file: File): Promise<{ photo: Photo }> => {
    await delay(500);
    const newPhoto: Photo = {
      id: crypto.randomUUID(),
      coupleId: mockCouple.id,
      uploadedBy: currentUser?.id ?? mockUser.id,
      blobUrl: URL.createObjectURL(file),
      caption: 'A beautiful new memory!',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    photos = [newPhoto, ...photos];
    return { photo: newPhoto };
  },

  deletePhoto: async (id: string): Promise<{ success: true }> => {
    await delay(300);
    photos = photos.filter((p) => p.id !== id);
    return { success: true };
  },

  logout: () => {
    currentUser = null;
  },
};
