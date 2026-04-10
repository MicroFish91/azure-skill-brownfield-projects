import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getServices } from '../services/registry';
import { handleError } from '../errors/errorHandler';
import { NotFoundError } from '../errors/errorTypes';
import { authenticateRequest } from '../middleware/authMiddleware';
import { logRequest } from '../middleware/requestLogger';
import { User, Invite } from 'couplesnap-shared/types';

app.http('listInvites', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'invites',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const startTime = Date.now();
    try {
      const auth = authenticateRequest(request);
      const { database } = getServices();
      const type = request.query.get('type') || 'received';

      const currentUser = await database.findById<User>('user', auth.userId);
      if (!currentUser) {
        throw new NotFoundError('User not found');
      }

      let invites: Invite[];
      if (type === 'sent') {
        invites = await database.findAll<Invite>('invite', { fromUserId: auth.userId });
      } else {
        invites = await database.findAll<Invite>('invite', { toEmail: currentUser.email });
      }

      return { status: 200, jsonBody: { invites } };
    } catch (error) {
      return handleError(error);
    } finally {
      logRequest(request, context, startTime);
    }
  },
});
