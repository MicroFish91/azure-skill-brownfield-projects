import type { ServiceContainer } from '../../src/services/registry.js';
import { loadConfig } from '../../src/services/config.js';
import { MockUserRepository } from './mockUserRepository.js';
import { MockCoupleRepository } from './mockCoupleRepository.js';
import { MockPhotoRepository } from './mockPhotoRepository.js';
import { MockBlobStorage } from './mockBlobStorage.js';
import { MockCaptionService } from './mockCaptionService.js';
import { MockAuthValidator } from './mockAuthValidator.js';

export interface MockServiceContainer extends ServiceContainer {
  users: MockUserRepository;
  couples: MockCoupleRepository;
  photos: MockPhotoRepository;
  blob: MockBlobStorage;
  captions: MockCaptionService;
  auth: MockAuthValidator;
}

export function buildMockServices(): MockServiceContainer {
  const users = new MockUserRepository();
  const couples = new MockCoupleRepository(users);
  return {
    config: loadConfig(),
    users,
    couples,
    photos: new MockPhotoRepository(),
    blob: new MockBlobStorage(),
    captions: new MockCaptionService(),
    auth: new MockAuthValidator()
  };
}

export {
  MockUserRepository,
  MockCoupleRepository,
  MockPhotoRepository,
  MockBlobStorage,
  MockCaptionService,
  MockAuthValidator
};
