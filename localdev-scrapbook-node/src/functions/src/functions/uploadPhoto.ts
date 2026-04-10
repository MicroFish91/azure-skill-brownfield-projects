import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { v4 as uuidv4 } from 'uuid';
import { getServices } from '../services/registry';
import { handleError } from '../errors/errorHandler';
import { BadRequestError, ForbiddenError, NotFoundError, ValidationError } from '../errors/errorTypes';
import { authenticateRequest } from '../middleware/authMiddleware';
import { logRequest } from '../middleware/requestLogger';
import { User, Photo } from 'couplesnap-shared/types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const CONTAINER_NAME = 'photos';

app.http('uploadPhoto', {
  methods: ['POST'],
  authLevel: 'anonymous',
  route: 'photos',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const startTime = Date.now();
    try {
      const auth = authenticateRequest(request);
      const { database, storage, aiCaption } = getServices();

      const currentUser = await database.findById<User>('user', auth.userId);
      if (!currentUser) {
        throw new NotFoundError('User not found');
      }

      if (!currentUser.coupleId) {
        throw new ForbiddenError('You must be part of a couple to upload photos');
      }

      const formData = await request.formData();
      const file = formData.get('file');
      if (!file || !(file instanceof Blob)) {
        throw new BadRequestError('No file provided. Send a file with the key "file".');
      }

      const contentType = (file as File).type || 'application/octet-stream';
      if (!ALLOWED_MIME_TYPES.includes(contentType)) {
        throw new ValidationError(
          `Invalid file type: ${contentType}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
        );
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      if (buffer.length > MAX_FILE_SIZE) {
        throw new ValidationError(`File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      }

      const extension = contentType.split('/')[1] === 'jpeg' ? 'jpg' : contentType.split('/')[1];
      const blobName = `${currentUser.coupleId}/${uuidv4()}.${extension}`;

      const blobUrl = await storage.upload(CONTAINER_NAME, blobName, buffer, contentType);

      let caption = formData.get('caption')?.toString() || '';
      if (!caption) {
        try {
          caption = await aiCaption.generateCaption(buffer, contentType);
        } catch {
          caption = 'A special moment 📸';
        }
      }

      const photo = await database.create<Photo>('photo', {
        coupleId: currentUser.coupleId,
        uploadedByUserId: auth.userId,
        blobUrl,
        caption,
      });

      return { status: 201, jsonBody: { photo } };
    } catch (error) {
      return handleError(error);
    } finally {
      logRequest(request, context, startTime);
    }
  },
});
