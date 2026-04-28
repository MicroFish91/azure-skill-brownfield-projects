/**
 * Global test setup.
 *
 * - Mocks `@azure/functions` so importing handler modules (which call
 *   `app.http(...)` at top level) is a no-op.
 * - Mocks the concrete service modules to prevent real DB/Storage clients
 *   from being constructed during the registry auto-init test.
 * - Provides default env vars so config validation passes.
 * - Registers fresh mock services before each test.
 */

import { beforeEach, vi } from 'vitest';
import { resetServicesForTesting, registerServices } from '../src/services/registry.js';
import { buildMockServices } from './mocks/index.js';

// --- env defaults ---
process.env.DATABASE_URL ??= 'postgresql://test:test@localhost:5432/testdb';
process.env.STORAGE_CONNECTION_STRING ??= 'UseDevelopmentStorage=true';
process.env.PHOTO_CONTAINER_NAME ??= 'photos';
process.env.ENTRA_TENANT_ID ??= 'test-tenant';
process.env.ENTRA_CLIENT_ID ??= '00000000-0000-0000-0000-000000000000';
process.env.ENTRA_API_AUDIENCE ??= 'api://test';
delete process.env.AZURE_OPENAI_ENDPOINT;
delete process.env.AZURE_OPENAI_API_KEY;

// --- @azure/functions: stub `app.http` so handler imports are side-effect free ---
vi.mock('@azure/functions', async () => {
  const actual = await vi.importActual<typeof import('@azure/functions')>('@azure/functions');
  return {
    ...actual,
    app: {
      ...actual.app,
      http: vi.fn()
    }
  };
});

// --- Stub concrete service modules so auto-init does not open real connections ---
vi.mock('../src/services/postgres/UserRepository.js', () => ({
  PostgresUserRepository: class {
    async findByEntraObjectId() { return null; }
    async findById() { return null; }
    async create() { return {}; }
    async setCoupleId() { return {}; }
    async countByCoupleId() { return 0; }
    async listByCoupleId() { return []; }
    async ping() { /* noop */ }
  }
}));
vi.mock('../src/services/postgres/CoupleRepository.js', () => ({
  PostgresCoupleRepository: class {
    async findById() { return null; }
    async findByInviteCode() { return null; }
    async create() { return {}; }
  }
}));
vi.mock('../src/services/postgres/PhotoRepository.js', () => ({
  PostgresPhotoRepository: class {
    async create() { return {}; }
    async findById() { return null; }
    async listByCoupleId() { return []; }
    async delete() { /* noop */ }
  }
}));
vi.mock('../src/services/blob/BlobStorage.js', () => ({
  AzureBlobStorage: class {
    async upload() { return { blobPath: 'mock' }; }
    async delete() { /* noop */ }
    async getReadUrl() { return 'https://mock.example/blob'; }
    async ping() { /* noop */ }
  }
}));
vi.mock('../src/services/auth/EntraValidator.js', () => ({
  EntraAuthValidator: class {
    async validate() {
      return { entraObjectId: 'auto', email: 'auto@example.com', displayName: 'Auto' };
    }
  }
}));

// Register fresh mocks before each test (auto-init tests reset themselves).
beforeEach(() => {
  resetServicesForTesting();
  registerServices(buildMockServices());
});
