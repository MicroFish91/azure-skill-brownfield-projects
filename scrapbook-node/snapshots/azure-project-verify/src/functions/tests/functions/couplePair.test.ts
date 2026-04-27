import { describe, it, expect, beforeEach } from 'vitest';
import type { ApiErrorResponse, CoupleResponse } from '@app/shared';
import { couplePairHandler } from '../../src/functions/couplePair.js';
import { coupleGetHandler } from '../../src/functions/coupleGet.js';
import { getServices } from '../../src/services/registry.js';
import { authedHeaders, createMockContext, createMockRequest } from '../helpers.js';
import type { MockServiceContainer } from '../mocks/index.js';

async function ensureCoupleFor(token: string) {
  await coupleGetHandler(
    createMockRequest({ headers: authedHeaders(token) }),
    createMockContext()
  );
}

describe('POST /api/couple/pair', () => {
  beforeEach(() => {
    const services = getServices() as MockServiceContainer;
    services.auth.setPrincipal('alice', {
      entraObjectId: 'oid-alice', email: 'alice@example.com', displayName: 'Alice'
    });
    services.auth.setPrincipal('bob', {
      entraObjectId: 'oid-bob', email: 'bob@example.com', displayName: 'Bob'
    });
    services.auth.setPrincipal('carol', {
      entraObjectId: 'oid-carol', email: 'carol@example.com', displayName: 'Carol'
    });
  });

  it('returns 401 without auth', async () => {
    const res = await couplePairHandler(
      createMockRequest({ method: 'POST', body: { inviteCode: 'ABCDEF' } }),
      createMockContext()
    );
    expect(res.status).toBe(401);
  });

  it('returns 422 when inviteCode is missing', async () => {
    const res = await couplePairHandler(
      createMockRequest({
        method: 'POST',
        headers: authedHeaders('alice'),
        body: {}
      }),
      createMockContext()
    );
    expect(res.status).toBe(422);
    expect((res.jsonBody as ApiErrorResponse).error.code).toBe('VALIDATION_ERROR');
  });

  it('returns 404 for an unknown invite code', async () => {
    const res = await couplePairHandler(
      createMockRequest({
        method: 'POST',
        headers: authedHeaders('alice'),
        body: { inviteCode: 'NOSUCH99' }
      }),
      createMockContext()
    );
    expect(res.status).toBe(404);
  });

  it('returns 409 when the user is already paired', async () => {
    await ensureCoupleFor('alice');
    const services = getServices() as MockServiceContainer;
    const otherCouple = await services.couples.create();

    const res = await couplePairHandler(
      createMockRequest({
        method: 'POST',
        headers: authedHeaders('alice'),
        body: { inviteCode: otherCouple.inviteCode }
      }),
      createMockContext()
    );
    expect(res.status).toBe(409);
  });

  it('returns 409 when pairing with your own invite code', async () => {
    await ensureCoupleFor('alice');
    const services = getServices() as MockServiceContainer;
    const myCouple = [...services.couples.couples.values()][0];

    // Force alice to be unpaired but try to use her own couple's code
    const alice = [...services.users.users.values()].find((u) => u.email === 'alice@example.com')!;
    await services.users.setCoupleId(alice.id, null);
    // Re-attach alice as a member by reading the couple again — invite code unchanged.
    await services.users.setCoupleId(alice.id, myCouple.id);

    // Now alice is paired and tries to use her own couple's code → conflict (already paired).
    const res = await couplePairHandler(
      createMockRequest({
        method: 'POST',
        headers: authedHeaders('alice'),
        body: { inviteCode: myCouple.inviteCode }
      }),
      createMockContext()
    );
    expect(res.status).toBe(409);
  });

  it('returns 409 when the target couple already has 2 members', async () => {
    await ensureCoupleFor('alice');
    // Bob pairs with alice — couple now full.
    const services = getServices() as MockServiceContainer;
    const aliceCouple = [...services.couples.couples.values()][0];
    const pair1 = await couplePairHandler(
      createMockRequest({
        method: 'POST',
        headers: authedHeaders('bob'),
        body: { inviteCode: aliceCouple.inviteCode }
      }),
      createMockContext()
    );
    expect(pair1.status).toBe(200);

    // Carol tries to join — should be blocked.
    const res = await couplePairHandler(
      createMockRequest({
        method: 'POST',
        headers: authedHeaders('carol'),
        body: { inviteCode: aliceCouple.inviteCode }
      }),
      createMockContext()
    );
    expect(res.status).toBe(409);
  });

  it('successfully pairs Bob with Alice', async () => {
    await ensureCoupleFor('alice');
    const services = getServices() as MockServiceContainer;
    const aliceCouple = [...services.couples.couples.values()][0];

    const res = await couplePairHandler(
      createMockRequest({
        method: 'POST',
        headers: authedHeaders('bob'),
        body: { inviteCode: aliceCouple.inviteCode }
      }),
      createMockContext()
    );

    expect(res.status).toBe(200);
    const body = res.jsonBody as CoupleResponse;
    expect(body.couple.id).toBe(aliceCouple.id);
    expect(body.couple.members).toHaveLength(2);
    expect(body.couple.members.map((m) => m.email).sort()).toEqual([
      'alice@example.com',
      'bob@example.com'
    ]);
  });
});
