import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getServices } from '../services/registry';
import { handleError } from '../errors/errorHandler';
import { ForbiddenError, NotFoundError, ValidationError } from '../errors/errorTypes';
import { authenticateRequest } from '../middleware/authMiddleware';
import { logRequest } from '../middleware/requestLogger';
import { uuidParamSchema } from 'couplesnap-shared/schemas/params';
import { User, Photo } from 'couplesnap-shared/types';

app.http('getPhoto', {
  methods: ['GET'],
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

      const { database } = getServices();

      const currentUser = await database.findById<User>('user', auth.userId);
      if (!currentUser) {
        throw new NotFoundError('User not found');
      }

      const photo = await database.findById<Photo>('photo', photoId!);
      if (!photo) {
        throw new NotFoundError('Photo not found');
      }

      if (photo.coupleId !== currentUser.coupleId) {
        throw new ForbiddenError('You do not have access to this photo');
      }

      return { status: 200, jsonBody: { photo } };
    } catch (error) {
      return handleError(error);
    } finally {
      logRequest(request, context, startTime);
    }
  },
});
