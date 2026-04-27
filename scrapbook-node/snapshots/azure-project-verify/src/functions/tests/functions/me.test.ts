import { describe, it, expect } from 'vitest';
import type { MeResponse, ApiErrorResponse } from '@app/shared';
import { meHandler } from '../../src/functions/me.js';
import { getServices } from '../../src/services/registry.js';
import { authedHeaders, createMockContext, createMockRequest } from '../helpers.js';
import type { MockServiceContainer } from '../mocks/index.js';

describe('GET /api/me', () => {
  it('returns 401 when no Authorization header is present', async () => {
    const res = await meHandler(createMockRequest(), createMockContext());
    expect(res.status).toBe(401);
    const body = res.jsonBody as ApiErrorResponse;
    expect(body.error.code).toBe('UNAUTHORIZED');
  });

  it('returns 401 when the bearer token is invalid', async () => {
    const res = await meHandler(
      createMockRequest({ headers: authedHeaders('invalid') }),
      createMockContext()
    );
    expect(res.status).toBe(401);
  });

  it('auto-provisions the user on first call and returns the profile', async () => {
    const services = getServices() as MockServiceContainer;
    services.auth.setPrincipal('alice', {
      entraObjectId: 'oid-alice',
      email: 'alice@example.com',
      displayName: 'Alice'
    });

    const res = await meHandler(
      createMockRequest({ headers: authedHeaders('alice') }),
      createMockContext()
    );

    expect(res.status).toBe(200);
    const body = res.jsonBody as MeResponse;
    expect(body.user.entraObjectId).toBe('oid-alice');
    expect(body.user.email).toBe('alice@example.com');
    expect(services.users.users.size).toBe(1);
  });

  it('reuses the existing user on subsequent calls', async () => {
    const services = getServices() as MockServiceContainer;
    services.auth.setPrincipal('alice', {
      entraObjectId: 'oid-alice',
      email: 'alice@example.com',
      displayName: 'Alice'
    });

    const first = await meHandler(
      createMockRequest({ headers: authedHeaders('alice') }),
      createMockContext()
    );
    const second = await meHandler(
      createMockRequest({ headers: authedHeaders('alice') }),
      createMockContext()
    );

    expect(first.status).toBe(200);
    expect(second.status).toBe(200);
    expect((first.jsonBody as MeResponse).user.id).toBe(
      (second.jsonBody as MeResponse).user.id
    );
    expect(services.users.users.size).toBe(1);
  });
});
