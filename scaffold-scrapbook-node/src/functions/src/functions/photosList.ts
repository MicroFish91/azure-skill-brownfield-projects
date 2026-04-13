import { app } from '@azure/functions';
import { getServices } from '../services/registry.js';
import { handleError } from '../errors/errorHandler.js';
import { extractUserId } from '../middleware/authMiddleware.js';
import { ForbiddenError } from '../errors/AppError.js';
import type { User, Photo } from 'scrapbook-shared';

app.http('photosList', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'photos',
  handler: async (request, context) => {
    try {
      const userId = extractUserId(request);
      const { database } = getServices();

      const user = await database.findById<User>('user', userId);
      if (!user?.coupleId) {
        throw new ForbiddenError('You must be in a couple to view photos');
      }

      const limit = Number(request.query.get('limit')) || 20;
      const offset = Number(request.query.get('offset')) || 0;

      const photos = await database.findAll<Photo>('photo', {
        filter: { coupleId: user.coupleId },
        limit,
        offset,
        orderBy: 'createdAt',
        orderDirection: 'desc',
      });

      const total = await database.count('photo', { coupleId: user.coupleId });

      return {
        status: 200,
        jsonBody: { photos, total },
      };
    } catch (error) {
      return handleError(error, context);
    }
  },
});
