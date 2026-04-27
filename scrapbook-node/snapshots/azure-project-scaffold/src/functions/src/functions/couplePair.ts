import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import type { CoupleResponse } from '@app/shared';
import { pairCoupleSchema } from '@app/shared';
import { authenticate } from '../middleware/authMiddleware.js';
import { withErrors } from '../middleware/errorMiddleware.js';
import { AppError } from '../errors/AppError.js';
import { getServices } from '../services/registry.js';

export const couplePairHandler = withErrors(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const services = getServices();
    const { user } = await authenticate(req, ctx);

    if (user.coupleId) {
      throw AppError.conflict('You are already paired with a partner');
    }

    const json = (await req.json().catch(() => null)) as unknown;
    const parsed = pairCoupleSchema.parse(json ?? {});

    const partnerCouple = await services.couples.findByInviteCode(parsed.inviteCode);
    if (!partnerCouple) throw AppError.notFound('Invite code not recognized');

    const memberCount = await services.users.countByCoupleId(partnerCouple.id);
    if (memberCount >= 2) throw AppError.conflict('That couple is already full');

    if (partnerCouple.members.some((m) => m.id === user.id)) {
      throw AppError.conflict('Cannot pair with your own invite code');
    }

    await services.users.setCoupleId(user.id, partnerCouple.id);

    const refreshed = await services.couples.findById(partnerCouple.id);
    if (!refreshed) throw AppError.internal('Couple disappeared after pairing');

    const body: CoupleResponse = { couple: refreshed };
    return { status: 200, jsonBody: body };
  }
);

app.http('couplePair', {
  route: 'couple/pair',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: couplePairHandler
});
