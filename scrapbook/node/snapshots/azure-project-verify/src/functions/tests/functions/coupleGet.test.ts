import { describe, it, expect, beforeEach } from 'vitest';
import type { ApiErrorResponse, CoupleResponse } from '@app/shared';
import { coupleGetHandler } from '../../src/functions/coupleGet.js';
import { getServices } from '../../src/services/registry.js';
import { authedHeaders, createMockContext, createMockRequest } from '../helpers.js';
import type { MockServiceContainer } from '../mocks/index.js';

function setupAlice() {
  const services = getServices() as MockServiceContainer;
  services.auth.setPrincipal('alice', {
    entraObjectId: 'oid-alice',
    email: 'alice@example.com',
    displayName: 'Alice'
  });
  return services;
}

describe('GET /api/couple', () => {
  beforeEach(() => setupAlice());

  it('returns 401 without auth', async () => {
    const res = await coupleGetHandler(createMockRequest(), createMockContext());
    expect(res.status).toBe(401);
    expect((res.jsonBody as ApiErrorResponse).error.code).toBe('UNAUTHORIZED');
  });

  it('lazily creates a couple and assigns the caller when they have none', async () => {
    const services = getServices() as MockServiceContainer;
    const res = await coupleGetHandler(
      createMockRequest({ headers: authedHeaders('alice') }),
      createMockContext()
    );

    expect(res.status).toBe(200);
    const body = res.jsonBody as CoupleResponse;
    expect(body.couple.inviteCode).toMatch(/^MOCK-/);
    expect(body.couple.members).toHaveLength(1);
    expect(body.couple.members[0].displayName).toBe('Alice');

    const alice = [...services.users.users.values()][0];
    expect(alice.coupleId).toBe(body.couple.id);
  });

  it('returns the existing couple on subsequent calls', async () => {
    const headers = authedHeaders('alice');
    const first = await coupleGetHandler(
      createMockRequest({ headers }),
      createMockContext()
    );
    const second = await coupleGetHandler(
      createMockRequest({ headers }),
      createMockContext()
    );
    expect((first.jsonBody as CoupleResponse).couple.id).toBe(
      (second.jsonBody as CoupleResponse).couple.id
    );
  });
});
