import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import type { CoupleResponse } from '@app/shared';
import { authenticate } from '../middleware/authMiddleware.js';
import { withErrors } from '../middleware/errorMiddleware.js';
import { AppError } from '../errors/AppError.js';
import { getServices } from '../services/registry.js';

/**
 * Returns the caller's couple. If they don't have one yet, lazily creates
 * a fresh couple (with an invite code) so the user has something to share.
 */
export const coupleGetHandler = withErrors(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const services = getServices();
    const { user } = await authenticate(req, ctx);

    let coupleId = user.coupleId;
    if (!coupleId) {
      const created = await services.couples.create();
      await services.users.setCoupleId(user.id, created.id);
      coupleId = created.id;
    }

    const couple = await services.couples.findById(coupleId);
    if (!couple) throw AppError.notFound('Couple not found');

    const body: CoupleResponse = { couple };
    return { status: 200, jsonBody: body };
  }
);

app.http('coupleGet', {
  route: 'couple',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: coupleGetHandler
});
