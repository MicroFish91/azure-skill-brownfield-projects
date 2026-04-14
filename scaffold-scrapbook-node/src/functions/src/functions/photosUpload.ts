import { app } from '@azure/functions';
import { getServices } from '../services/registry.js';
import { handleError } from '../errors/errorHandler.js';
import { extractUserId } from '../middleware/authMiddleware.js';
import { ForbiddenError, ValidationError } from '../errors/AppError.js';
import { v4 as uuid } from 'uuid';
import type { User, Photo } from 'scrapbook-shared';
import { logger } from '../logger.js';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

app.http('photosUpload', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'photos',
  handler: async (request, context) => {
    try {
      const userId = extractUserId(request);
      const { database, storage, caption } = getServices();

      const user = await database.findById<User>('user', userId);
      if (!user?.coupleId) {
        throw new ForbiddenError('You must be in a couple to upload photos');
      }

      const formData = await request.formData();
      const file = formData.get('file');

      if (!file || !(file instanceof Blob)) {
        throw new ValidationError('File is required');
      }

      if (file.size > MAX_FILE_SIZE) {
        throw new ValidationError(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      }

      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        throw new ValidationError(`File type '${file.type}' is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const photoId = uuid();
      const blobName = `${user.coupleId}/${photoId}`;

      const blobUrl = await storage.upload('photos', blobName, buffer, file.type);

      // Enhancement service — caption generation with fallback
      let generatedCaption = '';
      try {
        generatedCaption = await caption.generateCaption(buffer);
      } catch (error) {
        logger.warn({ err: error }, 'Caption generation failed — using empty caption');
      }

      const photo = await database.create<Photo>('photo', {
        id: photoId,
        coupleId: user.coupleId,
        uploadedBy: userId,
        blobUrl,
        caption: generatedCaption,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });

      return {
        status: 201,
        jsonBody: { photo },
      };
    } catch (error) {
      return handleError(error, context);
    }
  },
});
