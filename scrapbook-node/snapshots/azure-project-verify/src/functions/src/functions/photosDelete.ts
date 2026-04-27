import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import { photoIdParamSchema } from '@app/shared';
import { authenticate } from '../middleware/authMiddleware.js';
import { withErrors } from '../middleware/errorMiddleware.js';
import { AppError } from '../errors/AppError.js';
import { getServices } from '../services/registry.js';

export const photosDeleteHandler = withErrors(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const services = getServices();
    const { user } = await authenticate(req, ctx);
    if (!user.coupleId) throw AppError.forbidden('Pair with a partner first');

    const { id } = photoIdParamSchema.parse({ id: req.params.id });

    const photo = await services.photos.findById(id);
    if (!photo) throw AppError.notFound('Photo not found');
    if (photo.coupleId !== user.coupleId) {
      throw AppError.forbidden('Photo belongs to another couple');
    }

    await services.blob.delete(photo.blobPath).catch(() => {
      /* best-effort: orphan blob is acceptable */
    });
    await services.photos.delete(id);

    return { status: 204 };
  }
);

app.http('photosDelete', {
  route: 'photos/{id}',
  methods: ['DELETE'],
  authLevel: 'anonymous',
  handler: photosDeleteHandler
});
