import { describe, it, expect } from 'vitest';
import {
  getServices,
  registerServices,
  resetServicesForTesting,
  type ServiceContainer
} from '../../src/services/registry.js';
import { buildMockServices } from '../mocks/index.js';

describe('service registry', () => {
  it('returns the pre-registered services container', () => {
    const services = getServices();
    expect(services.users).toBeDefined();
    expect(services.couples).toBeDefined();
    expect(services.photos).toBeDefined();
    expect(services.blob).toBeDefined();
    expect(services.captions).toBeDefined();
    expect(services.auth).toBeDefined();
    expect(services.config).toBeDefined();
  });

  it('pre-registered mocks take priority over auto-init', () => {
    const customMocks: ServiceContainer = buildMockServices();
    registerServices(customMocks);
    expect(getServices()).toBe(customMocks);
  });

  it('auto-initializes with concrete services after reset (Rule 13)', () => {
    // Reset so getServices() must run initializeServices() with the
    // mocked concrete service classes from setup.ts.
    resetServicesForTesting();
    expect(() => getServices()).not.toThrow();
    const services = getServices();
    expect(services.users).toBeDefined();
    expect(services.couples).toBeDefined();
    expect(services.photos).toBeDefined();
    expect(services.blob).toBeDefined();
    expect(services.captions).toBeDefined(); // Enhancement fallback always present
    expect(services.auth).toBeDefined();
  });
});
