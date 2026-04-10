import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { getServices } from '../services/registry';
import { handleError } from '../errors/errorHandler';
import { BadRequestError, ConflictError, ValidationError } from '../errors/errorTypes';
import { authenticateRequest } from '../middleware/authMiddleware';
import { logRequest } from '../middleware/requestLogger';
import { createInviteSchema } from 'couplesnap-shared/schemas/invite';
import { User, Invite } from 'couplesnap-shared/types';

app.http('createInvite', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'invites',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const startTime = Date.now();
    try {
      const auth = authenticateRequest(request);
      const body = await request.json();
      const parsed = createInviteSchema.safeParse(body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.flatten().fieldErrors);
      }

      const { toEmail } = parsed.data;
      const { database } = getServices();

      const currentUser = await database.findById<User>('user', auth.userId);
      if (!currentUser) {
        throw new BadRequestError('User not found');
      }

      if (currentUser.email === toEmail) {
        throw new BadRequestError('You cannot invite yourself');
      }

      if (currentUser.coupleId) {
        throw new ConflictError('You are already in a couple');
      }

      const existingInvite = await database.findOne<Invite>('invite', {
        fromUserId: auth.userId,
        toEmail,
        status: 'pending',
      });
      if (existingInvite) {
        throw new ConflictError('A pending invite to this email already exists');
      }

      const invite = await database.create<Invite>('invite', {
        fromUserId: auth.userId,
        toEmail,
        status: 'pending',
      });

      return { status: 201, jsonBody: { invite } };
    } catch (error) {
      return handleError(error);
    } finally {
      logRequest(request, context, startTime);
    }
  },
});
