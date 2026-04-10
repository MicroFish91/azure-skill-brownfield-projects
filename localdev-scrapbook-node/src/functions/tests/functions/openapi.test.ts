jest.mock('@azure/functions', () => ({
  app: { http: jest.fn() },
}));

import { app } from '@azure/functions';
import { createMockRequest, createMockContext } from '../helpers/testUtils';

require('../../src/functions/openapi');

const handler = (app.http as jest.Mock).mock.calls[0][1].handler;

describe('openapi', () => {
  it('should return 200 with valid JSON containing openapi field', async () => {
    const request = createMockRequest({ method: 'GET' });
    const result = await handler(request, createMockContext());

    expect(result.status).toBe(200);
    expect(result.jsonBody).toBeDefined();
    expect(result.jsonBody.openapi).toBeDefined();
    expect(result.jsonBody.openapi).toBe('3.0.3');
    expect(result.jsonBody.info).toBeDefined();
    expect(result.jsonBody.info.title).toBe('CoupleSnap API');
    expect(result.jsonBody.paths).toBeDefined();
  });

  it('should include Content-Type header', async () => {
    const request = createMockRequest({ method: 'GET' });
    const result = await handler(request, createMockContext());

    expect(result.headers).toBeDefined();
    expect(result.headers['Content-Type']).toBe('application/json');
  });
});
