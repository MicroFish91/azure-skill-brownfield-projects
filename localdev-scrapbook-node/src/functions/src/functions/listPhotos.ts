import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getServices } from '../services/registry';
import { handleError } from '../errors/errorHandler';
import { ForbiddenError, NotFoundError, ValidationError } from '../errors/errorTypes';
import { authenticateRequest } from '../middleware/authMiddleware';
import { logRequest } from '../middleware/requestLogger';
import { listPhotosQuerySchema } from 'couplesnap-shared/schemas/photo';
import { User, Photo } from 'couplesnap-shared/types';

app.http('listPhotos', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'photos',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const startTime = Date.now();
    try {
      const auth = authenticateRequest(request);
      const { database } = getServices();

      const currentUser = await database.findById<User>('user', auth.userId);
      if (!currentUser) {
        throw new NotFoundError('User not found');
      }

      if (!currentUser.coupleId) {
        throw new ForbiddenError('You must be part of a couple to view photos');
      }

      const queryParams = {
        limit: request.query.get('limit') ?? '20',
        offset: request.query.get('offset') ?? '0',
      };
      const parsed = listPhotosQuerySchema.safeParse(queryParams);
      if (!parsed.success) {
        throw new ValidationError('Invalid query parameters', parsed.error.flatten().fieldErrors);
      }

      const { limit, offset } = parsed.data;
      const allPhotos = await database.findAll<Photo>('photo', {
        coupleId: currentUser.coupleId,
      });

      const total = allPhotos.length;
      const photos = allPhotos.slice(offset, offset + limit);

      return { status: 200, jsonBody: { photos, total } };
    } catch (error) {
      return handleError(error);
    } finally {
      logRequest(request, context, startTime);
    }
  },
});
