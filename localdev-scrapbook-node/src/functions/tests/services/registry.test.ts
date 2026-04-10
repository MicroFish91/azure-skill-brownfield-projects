import { registerServices, getServices, resetServices } from '../../src/services/registry';
import { MockDatabaseService } from '../mocks/MockDatabaseService';
import { MockStorageService } from '../mocks/MockStorageService';
import { MockAICaptionService } from '../mocks/MockAICaptionService';

describe('registry', () => {
  afterEach(() => {
    resetServices();
  });

  it('should store services via registerServices and return them via getServices', () => {
    const database = new MockDatabaseService();
    const storage = new MockStorageService();
    const aiCaption = new MockAICaptionService();

    registerServices({ database, storage, aiCaption });

    const services = getServices();
    expect(services.database).toBe(database);
    expect(services.storage).toBe(storage);
    expect(services.aiCaption).toBe(aiCaption);
  });

  it('should return the same services on repeated getServices calls', () => {
    const database = new MockDatabaseService();
    const storage = new MockStorageService();
    const aiCaption = new MockAICaptionService();

    registerServices({ database, storage, aiCaption });

    const services1 = getServices();
    const services2 = getServices();
    expect(services1).toBe(services2);
  });

  it('should clear the registry on resetServices', () => {
    const database = new MockDatabaseService();
    const storage = new MockStorageService();
    const aiCaption = new MockAICaptionService();

    registerServices({ database, storage, aiCaption });
    expect(getServices().database).toBe(database);

    resetServices();

    // After reset, registering new services should work
    const database2 = new MockDatabaseService();
    const storage2 = new MockStorageService();
    const aiCaption2 = new MockAICaptionService();
    registerServices({ database: database2, storage: storage2, aiCaption: aiCaption2 });

    const services = getServices();
    expect(services.database).toBe(database2);
    expect(services.database).not.toBe(database);
  });
});
