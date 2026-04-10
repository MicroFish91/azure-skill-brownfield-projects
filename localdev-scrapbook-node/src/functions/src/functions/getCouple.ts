import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getServices } from '../services/registry';
import { handleError } from '../errors/errorHandler';
import { NotFoundError } from '../errors/errorTypes';
import { authenticateRequest } from '../middleware/authMiddleware';
import { logRequest } from '../middleware/requestLogger';
import { User, Couple, PublicUser } from 'couplesnap-shared/types';

app.http('getCouple', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'couple',
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
        throw new NotFoundError('You are not part of a couple yet');
      }

      const couple = await database.findById<Couple>('couple', currentUser.coupleId);
      if (!couple) {
        throw new NotFoundError('Couple not found');
      }

      const allUsersInCouple = await database.findAll<User>('user', {
        coupleId: currentUser.coupleId,
      });
      const partnerUser = allUsersInCouple.find((u) => u.id !== auth.userId);
      if (!partnerUser) {
        throw new NotFoundError('Partner not found');
      }

      const partner: PublicUser = {
        id: partnerUser.id,
        email: partnerUser.email,
        displayName: partnerUser.displayName,
        coupleId: partnerUser.coupleId,
        createdAt: partnerUser.createdAt,
        updatedAt: partnerUser.updatedAt,
      };

      return {
        status: 200,
        jsonBody: {
          couple: { ...couple, partner },
        },
      };
    } catch (error) {
      return handleError(error);
    } finally {
      logRequest(request, context, startTime);
    }
  },
});
