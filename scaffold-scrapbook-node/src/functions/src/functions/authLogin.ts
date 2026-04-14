import { app } from '@azure/functions';
import { getServices } from '../services/registry.js';
import { handleError } from '../errors/errorHandler.js';
import { validateBody } from '../middleware/validateRequest.js';
import { loginSchema } from 'scrapbook-shared';
import { UnauthorizedError } from '../errors/AppError.js';
import { toPublicUser } from '../utils/sanitize.js';
import type { User } from 'scrapbook-shared';

app.http('authLogin', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/login',
  handler: async (request, context) => {
    try {
      const body = await validateBody(request, loginSchema);
      const { database, auth } = getServices();

      const user = await database.findOne<User>('user', { email: body.email });
      if (!user) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const valid = await auth.comparePassword(body.password, user.passwordHash);
      if (!valid) {
        throw new UnauthorizedError('Invalid email or password');
      }

      const token = auth.generateToken(user.id);

      return {
        status: 200,
        jsonBody: { token, user: toPublicUser(user) },
      };
    } catch (error) {
      return handleError(error, context);
    }
  },
});
