import { app } from '@azure/functions';
import { getServices } from '../services/registry.js';
import { handleError } from '../errors/errorHandler.js';
import { extractUserId } from '../middleware/authMiddleware.js';
import { validateParams } from '../middleware/validateRequest.js';
import { uuidParamSchema } from 'scrapbook-shared';
import { NotFoundError, ForbiddenError, ConflictError } from '../errors/AppError.js';
import type { Couple } from 'scrapbook-shared';

app.http('couplesAccept', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'couples/{id}/accept',
  handler: async (request, context) => {
    try {
      const userId = extractUserId(request);
      const { id } = validateParams(request.params as Record<string, string>, uuidParamSchema);
      const { database } = getServices();

      const couple = await database.findById<Couple>('couple', id);
      if (!couple) {
        throw new NotFoundError('Couple', id);
      }

      if (couple.user2Id !== userId) {
        throw new ForbiddenError('Only the invited partner can accept');
      }

      if (couple.status === 'accepted') {
        throw new ConflictError('Couple invitation already accepted');
      }

      const updatedCouple = await database.transaction(async (trx) => {
        const updated = await trx.update<Couple>('couple', id, { status: 'accepted' as const });

        await trx.update('user', couple.user1Id, { coupleId: id });
        await trx.update('user', couple.user2Id, { coupleId: id });

        return updated;
      });

      return {
        status: 200,
        jsonBody: { couple: updatedCouple },
      };
    } catch (error) {
      return handleError(error, context);
    }
  },
});
