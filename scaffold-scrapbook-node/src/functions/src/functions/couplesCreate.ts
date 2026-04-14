import { app } from '@azure/functions';
import { getServices } from '../services/registry.js';
import { handleError } from '../errors/errorHandler.js';
import { validateBody } from '../middleware/validateRequest.js';
import { extractUserId } from '../middleware/authMiddleware.js';
import { createCoupleSchema } from 'scrapbook-shared';
import { NotFoundError, ConflictError } from '../errors/AppError.js';
import { v4 as uuid } from 'uuid';
import type { User, Couple } from 'scrapbook-shared';

app.http('couplesCreate', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'couples',
  handler: async (request, context) => {
    try {
      const userId = extractUserId(request);
      const body = await validateBody(request, createCoupleSchema);
      const { database } = getServices();

      const currentUser = await database.findById<User>('user', userId);
      if (currentUser?.coupleId) {
        throw new ConflictError('You are already in a couple');
      }

      const partner = await database.findOne<User>('user', { email: body.partnerEmail });
      if (!partner) {
        throw new NotFoundError('User', body.partnerEmail);
      }

      if (partner.coupleId) {
        throw new ConflictError('Partner is already in a couple');
      }

      if (partner.id === userId) {
        throw new ConflictError('Cannot create a couple with yourself');
      }

      const couple = await database.create<Couple>('couple', {
        id: uuid(),
        user1Id: userId,
        user2Id: partner.id,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return {
        status: 201,
        jsonBody: { couple },
      };
    } catch (error) {
      return handleError(error, context);
    }
  },
});
