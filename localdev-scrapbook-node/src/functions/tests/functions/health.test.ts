jest.mock('@azure/functions', () => ({
  app: { http: jest.fn() },
}));

import { app } from '@azure/functions';
import { setupTestServices, createMockRequest, createMockContext } from '../helpers/testUtils';
import { resetServices } from '../../src/services/registry';

const services = setupTestServices();
require('../../src/functions/health');

const handler = (app.http as jest.Mock).mock.calls[0][1].handler;

describe('health', () => {
  afterAll(() => {
    resetServices();
  });

  it('should return 200 with healthy status when all services are up', async () => {
    const request = createMockRequest({ method: 'GET' });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(200);
    expect(result.jsonBody.status).toBe('healthy');
    expect(result.jsonBody.services).toBeDefined();
    expect(result.jsonBody.services.database).toBe(true);
    expect(result.jsonBody.services.storage).toBe(true);
    expect(result.jsonBody.services.aiCaption).toBe(true);
    expect(result.jsonBody.timestamp).toBeDefined();
  });

  it('should return 200 with degraded status when AI caption is down', async () => {
    services.aiCaption.shouldFail = true;

    const request = createMockRequest({ method: 'GET' });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(200);
    expect(result.jsonBody.status).toBe('degraded');
    expect(result.jsonBody.services.aiCaption).toBe(false);

    services.aiCaption.shouldFail = false;
  });
});
