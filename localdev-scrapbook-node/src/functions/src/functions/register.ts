import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getServices } from '../services/registry';
import { getConfig } from '../services/config';
import { handleError } from '../errors/errorHandler';
import { ConflictError, ValidationError } from '../errors/errorTypes';
import { logRequest } from '../middleware/requestLogger';
import { registerSchema } from 'couplesnap-shared/schemas/auth';
import { User, PublicUser } from 'couplesnap-shared/types';

app.http('register', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/register',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const startTime = Date.now();
    try {
      const body = await request.json();
      const parsed = registerSchema.safeParse(body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.flatten().fieldErrors);
      }

      const { email, password, displayName } = parsed.data;
      const { database } = getServices();

      const existing = await database.findOne<User>('user', { email });
      if (existing) {
        throw new ConflictError('A user with this email already exists');
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const user = await database.create<User>('user', {
        email,
        passwordHash,
        displayName,
        coupleId: null,
      });

      const config = getConfig();
      const token = jwt.sign({ userId: user.id, email: user.email }, config.JWT_SECRET, {
        expiresIn: '7d',
      });

      const publicUser: PublicUser = {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        coupleId: user.coupleId,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      };

      return { status: 201, jsonBody: { user: publicUser, token } };
    } catch (error) {
      return handleError(error);
    } finally {
      logRequest(request, context, startTime);
    }
  },
});
