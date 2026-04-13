import { app } from '@azure/functions';
import { getServices } from '../services/registry.js';
import { handleError } from '../errors/errorHandler.js';
import { extractUserId } from '../middleware/authMiddleware.js';
import { validateParams } from '../middleware/validateRequest.js';
import { uuidParamSchema } from 'scrapbook-shared';
import { NotFoundError, ForbiddenError } from '../errors/AppError.js';
import { toPublicUser } from '../utils/sanitize.js';
import type { Couple, User } from 'scrapbook-shared';

app.http('couplesGet', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'couples/{id}',
  handler: async (request, context) => {
    try {
      const userId = extractUserId(request);
      const { id } = validateParams(request.params as Record<string, string>, uuidParamSchema);
      const { database } = getServices();

      const couple = await database.findById<Couple>('couple', id);
      if (!couple) {
        throw new NotFoundError('Couple', id);
      }

      if (couple.user1Id !== userId && couple.user2Id !== userId) {
        throw new ForbiddenError('You are not part of this couple');
      }

      const user1 = await database.findById<User>('user', couple.user1Id);
      const user2 = await database.findById<User>('user', couple.user2Id);
      const users = [user1, user2].filter(Boolean).map((u) => toPublicUser(u!));

      return {
        status: 200,
        jsonBody: { couple, users },
      };
    } catch (error) {
      return handleError(error, context);
    }
  },
});
