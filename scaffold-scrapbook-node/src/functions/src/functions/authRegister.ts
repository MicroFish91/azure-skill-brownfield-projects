import { app } from '@azure/functions';
import { getServices } from '../services/registry.js';
import { handleError } from '../errors/errorHandler.js';
import { validateBody } from '../middleware/validateRequest.js';
import { registerSchema } from 'scrapbook-shared';
import { ConflictError } from '../errors/AppError.js';
import { toPublicUser } from '../utils/sanitize.js';
import { v4 as uuid } from 'uuid';
import type { User } from 'scrapbook-shared';

app.http('authRegister', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'auth/register',
  handler: async (request, context) => {
    try {
      const body = await validateBody(request, registerSchema);
      const { database, auth } = getServices();

      const existing = await database.findOne<User>('user', { email: body.email });
      if (existing) {
        throw new ConflictError('A user with this email already exists');
      }

      const passwordHash = await auth.hashPassword(body.password);
      const user = await database.create<User>('user', {
        id: uuid(),
        email: body.email,
        passwordHash,
        displayName: body.displayName,
        coupleId: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      const token = auth.generateToken(user.id);

      return {
        status: 201,
        jsonBody: { token, user: toPublicUser(user) },
      };
    } catch (error) {
      return handleError(error, context);
    }
  },
});
