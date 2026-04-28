import { describe, it, expect } from 'vitest';
import { openapiHandler } from '../../src/functions/openapi.js';
import { createMockRequest } from '../helpers.js';

describe('GET /api/openapi.json', () => {
  it('returns the OpenAPI 3 document', async () => {
    const res = await openapiHandler(createMockRequest());
    expect(res.status).toBe(200);
    const body = res.jsonBody as { openapi: string; paths: Record<string, unknown> };
    expect(body.openapi).toMatch(/^3\./);
    expect(body.paths['/health']).toBeDefined();
    expect(body.paths['/photos']).toBeDefined();
    expect(body.paths['/couple/pair']).toBeDefined();
  });
});
