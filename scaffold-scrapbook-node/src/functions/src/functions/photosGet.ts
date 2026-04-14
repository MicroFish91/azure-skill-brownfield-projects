import { app } from '@azure/functions';
import { getServices } from '../services/registry.js';
import { handleError } from '../errors/errorHandler.js';
import { extractUserId } from '../middleware/authMiddleware.js';
import { validateParams } from '../middleware/validateRequest.js';
import { uuidParamSchema } from 'scrapbook-shared';
import { NotFoundError, ForbiddenError } from '../errors/AppError.js';
import type { User, Photo } from 'scrapbook-shared';

app.http('photosGet', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'photos/{id}',
  handler: async (request, context) => {
    try {
      const userId = extractUserId(request);
      const { id } = validateParams(request.params as Record<string, string>, uuidParamSchema);
      const { database } = getServices();

      const user = await database.findById<User>('user', userId);
      if (!user?.coupleId) {
        throw new ForbiddenError('You must be in a couple to view photos');
      }

      const photo = await database.findById<Photo>('photo', id);
      if (!photo) {
        throw new NotFoundError('Photo', id);
      }

      if (photo.coupleId !== user.coupleId) {
        throw new ForbiddenError('This photo does not belong to your couple');
      }

      return {
        status: 200,
        jsonBody: { photo },
      };
    } catch (error) {
      return handleError(error, context);
    }
  },
});
