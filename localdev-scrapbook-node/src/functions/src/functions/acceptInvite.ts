import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getServices } from '../services/registry';
import { handleError } from '../errors/errorHandler';
import { BadRequestError, ForbiddenError, NotFoundError, ValidationError } from '../errors/errorTypes';
import { authenticateRequest } from '../middleware/authMiddleware';
import { logRequest } from '../middleware/requestLogger';
import { uuidParamSchema } from 'couplesnap-shared/schemas/params';
import { User, Invite, Couple } from 'couplesnap-shared/types';

app.http('acceptInvite', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'invites/{id}/accept',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const startTime = Date.now();
    try {
      const auth = authenticateRequest(request);
      const inviteId = request.params.id;

      const idParsed = uuidParamSchema.safeParse(inviteId);
      if (!idParsed.success) {
        throw new ValidationError('Invalid invite ID format');
      }

      const { database } = getServices();

      const currentUser = await database.findById<User>('user', auth.userId);
      if (!currentUser) {
        throw new NotFoundError('User not found');
      }

      const invite = await database.findById<Invite>('invite', inviteId!);
      if (!invite) {
        throw new NotFoundError('Invite not found');
      }

      if (invite.status !== 'pending') {
        throw new BadRequestError('This invite is no longer pending');
      }

      if (invite.toEmail !== currentUser.email) {
        throw new ForbiddenError('This invite is not addressed to you');
      }

      const result = await database.transaction(async (trx) => {
        const couple = await trx.create<Couple>('couple', {});

        await trx.update<User>('user', auth.userId, { coupleId: couple.id });
        await trx.update<User>('user', invite.fromUserId, { coupleId: couple.id });

        const updatedInvite = await trx.update<Invite>('invite', inviteId!, {
          status: 'accepted',
        });

        return { invite: updatedInvite!, couple };
      });

      return { status: 200, jsonBody: result };
    } catch (error) {
      return handleError(error);
    } finally {
      logRequest(request, context, startTime);
    }
  },
});
