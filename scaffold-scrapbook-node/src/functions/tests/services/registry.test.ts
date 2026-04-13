import { describe, it, expect, beforeEach } from 'vitest';
import { getServices, registerServices, clearServices } from '../../src/services/registry.js';
import { MockDatabaseService } from '../mocks/mockDatabaseService.js';
import { MockStorageService } from '../mocks/mockStorageService.js';
import { MockCaptionService } from '../mocks/mockCaptionService.js';
import { MockAuthService } from '../mocks/mockAuthService.js';

describe('Service Registry', () => {
  beforeEach(() => {
    clearServices();
  });

  it('should return registered mock services', () => {
    const db = new MockDatabaseService();
    const storage = new MockStorageService();
    const caption = new MockCaptionService();
    const auth = new MockAuthService();

    registerServices({ database: db, storage, caption, auth });

    const services = getServices();
    expect(services.database).toBe(db);
    expect(services.storage).toBe(storage);
    expect(services.caption).toBe(caption);
    expect(services.auth).toBe(auth);
  });

  it('should allow re-registration after clearServices', () => {
    const db1 = new MockDatabaseService();
    const db2 = new MockDatabaseService();
    const storage = new MockStorageService();
    const caption = new MockCaptionService();
    const auth = new MockAuthService();

    registerServices({ database: db1, storage, caption, auth });
    expect(getServices().database).toBe(db1);

    clearServices();

    registerServices({ database: db2, storage, caption, auth });
    expect(getServices().database).toBe(db2);
  });

  it('pre-registered mocks take priority over auto-initialization', () => {
    const db = new MockDatabaseService();
    const storage = new MockStorageService();
    const caption = new MockCaptionService();
    const auth = new MockAuthService();

    registerServices({ database: db, storage, caption, auth });

    const services = getServices();
    expect(services.database).toBe(db);
    expect(services.storage).toBe(storage);
    expect(services.caption).toBe(caption);
    expect(services.auth).toBe(auth);
  });

  it('should auto-initialize without throwing when enhancement config is missing', () => {
    clearServices();
    expect(() => getServices()).not.toThrow();
  });
});
