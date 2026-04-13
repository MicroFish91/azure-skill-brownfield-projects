import { app } from '@azure/functions';
import { getServices } from '../services/registry.js';
import { handleError } from '../errors/errorHandler.js';
import { extractUserId } from '../middleware/authMiddleware.js';
import { validateParams } from '../middleware/validateRequest.js';
import { uuidParamSchema } from 'scrapbook-shared';
import { NotFoundError, ForbiddenError } from '../errors/AppError.js';
import type { User, Photo } from 'scrapbook-shared';

app.http('photosDelete', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'photos/{id}',
  handler: async (request, context) => {
    try {
      const userId = extractUserId(request);
      const { id } = validateParams(request.params as Record<string, string>, uuidParamSchema);
      const { database, storage } = getServices();

      const user = await database.findById<User>('user', userId);
      if (!user?.coupleId) {
        throw new ForbiddenError('You must be in a couple to delete photos');
      }

      const photo = await database.findById<Photo>('photo', id);
      if (!photo) {
        throw new NotFoundError('Photo', id);
      }

      if (photo.coupleId !== user.coupleId) {
        throw new ForbiddenError('This photo does not belong to your couple');
      }

      const blobName = `${photo.coupleId}/${photo.id}`;
      await storage.delete('photos', blobName);
      await database.delete('photo', id);

      return {
        status: 200,
        jsonBody: { success: true },
      };
    } catch (error) {
      return handleError(error, context);
    }
  },
});
