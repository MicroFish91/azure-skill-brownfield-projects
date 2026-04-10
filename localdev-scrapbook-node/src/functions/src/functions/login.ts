import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getServices } from '../services/registry';
import { getConfig } from '../services/config';
import { handleError } from '../errors/errorHandler';
import { UnauthorizedError, ValidationError } from '../errors/errorTypes';
import { logRequest } from '../middleware/requestLogger';
import { loginSchema } from 'couplesnap-shared/schemas/auth';
import { User, PublicUser } from 'couplesnap-shared/types';

app.http('login', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const startTime = Date.now();
    try {
      const body = await request.json();
      const parsed = loginSchema.safeParse(body);
      if (!parsed.success) {
        throw new ValidationError('Validation failed', parsed.error.flatten().fieldErrors);
      }

      const { email, password } = parsed.data;
      const { database } = getServices();

      const user = await database.findOne<User>('user', { email });
      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        throw new UnauthorizedError('Invalid email or password');
      }

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

      return { status: 200, jsonBody: { user: publicUser, token } };
    } catch (error) {
      return handleError(error);
    } finally {
      logRequest(request, context, startTime);
    }
  },
});
