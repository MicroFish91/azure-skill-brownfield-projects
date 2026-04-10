import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getServices } from '../services/registry';
import { handleError } from '../errors/errorHandler';
import { ForbiddenError, NotFoundError, ValidationError } from '../errors/errorTypes';
import { authenticateRequest } from '../middleware/authMiddleware';
import { logRequest } from '../middleware/requestLogger';
import { uuidParamSchema } from 'couplesnap-shared/schemas/params';
import { Photo } from 'couplesnap-shared/types';

app.http('deletePhoto', {
  methods: ['DELETE'],
  authLevel: 'anonymous',
  route: 'photos/{id}',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const startTime = Date.now();
    try {
      const auth = authenticateRequest(request);
      const photoId = request.params.id;

      const idParsed = uuidParamSchema.safeParse(photoId);
      if (!idParsed.success) {
        throw new ValidationError('Invalid photo ID format');
      }

      const { database, storage } = getServices();

      const photo = await database.findById<Photo>('photo', photoId!);
      if (!photo) {
        throw new NotFoundError('Photo not found');
      }

      if (photo.uploadedByUserId !== auth.userId) {
        throw new ForbiddenError('You can only delete photos you uploaded');
      }

      // Extract blob name from URL
      const urlParts = photo.blobUrl.split('/');
      const container = urlParts[urlParts.length - 2];
      const blobName = urlParts.slice(-2).join('/');
      try {
        await storage.delete(container || 'photos', blobName);
      } catch {
        // Continue even if storage delete fails
      }

      await database.delete('photo', photoId!);

      return { status: 200, jsonBody: { success: true } };
    } catch (error) {
      return handleError(error);
    } finally {
      logRequest(request, context, startTime);
    }
  },
});
