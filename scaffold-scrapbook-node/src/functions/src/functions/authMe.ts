import { app } from '@azure/functions';
import { getServices } from '../services/registry.js';
import { handleError } from '../errors/errorHandler.js';
import { extractUserId } from '../middleware/authMiddleware.js';
import { NotFoundError } from '../errors/AppError.js';
import { toPublicUser } from '../utils/sanitize.js';
import type { User } from 'scrapbook-shared';

app.http('authMe', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auth/me',
  handler: async (request, context) => {
    try {
      const userId = extractUserId(request);
      const { database } = getServices();

      const user = await database.findById<User>('user', userId);
      if (!user) {
        throw new NotFoundError('User', userId);
      }

      return {
        status: 200,
        jsonBody: { user: toPublicUser(user) },
      };
    } catch (error) {
      return handleError(error, context);
    }
  },
});
