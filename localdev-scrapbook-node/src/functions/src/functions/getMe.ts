import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getServices } from '../services/registry';
import { handleError } from '../errors/errorHandler';
import { NotFoundError } from '../errors/errorTypes';
import { authenticateRequest } from '../middleware/authMiddleware';
import { logRequest } from '../middleware/requestLogger';
import { User, PublicUser } from 'couplesnap-shared/types';

app.http('getMe', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'auth/me',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const startTime = Date.now();
    try {
      const auth = authenticateRequest(request);
      const { database } = getServices();

      const user = await database.findById<User>('user', auth.userId);
      if (!user) {
        throw new NotFoundError('User not found');
      }

      const publicUser: PublicUser = {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        coupleId: user.coupleId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return { status: 200, jsonBody: { user: publicUser } };
    } catch (error) {
      return handleError(error);
    } finally {
      logRequest(request, context, startTime);
    }
  },
});
