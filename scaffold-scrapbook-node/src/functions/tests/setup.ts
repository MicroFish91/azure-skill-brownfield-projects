import { beforeEach, afterEach } from 'vitest';
import { registerServices, clearServices } from '../src/services/registry.js';
import { MockDatabaseService } from './mocks/mockDatabaseService.js';
import { MockStorageService } from './mocks/mockStorageService.js';
import { MockCaptionService } from './mocks/mockCaptionService.js';
import { MockAuthService } from './mocks/mockAuthService.js';
import userFixtures from './fixtures/users.json';
import coupleFixtures from './fixtures/couples.json';
import photoFixtures from './fixtures/photos.json';

// Set env vars for tests
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/testdb';
process.env.STORAGE_CONNECTION_STRING = 'UseDevelopmentStorage=true';

beforeEach(() => {
  registerServices({
    database: new MockDatabaseService({
      user: userFixtures.validUsers,
      couple: coupleFixtures.validCouples,
      photo: photoFixtures.validPhotos,
    }),
    storage: new MockStorageService(),
    caption: new MockCaptionService(),
    auth: new MockAuthService(),
  });
});

afterEach(() => {
  clearServices();
});
