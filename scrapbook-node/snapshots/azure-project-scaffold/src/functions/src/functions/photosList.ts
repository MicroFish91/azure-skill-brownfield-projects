import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import type { PhotoListResponse } from '@app/shared';
import { authenticate } from '../middleware/authMiddleware.js';
import { withErrors } from '../middleware/errorMiddleware.js';
import { AppError } from '../errors/AppError.js';
import { getServices } from '../services/registry.js';
import { toPublicPhoto } from '../utils/toPublicPhoto.js';

export const photosListHandler = withErrors(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const services = getServices();
    const { user } = await authenticate(req, ctx);
    if (!user.coupleId) throw AppError.forbidden('Pair with a partner to view shared photos');

    const rows = await services.photos.listByCoupleId(user.coupleId);
    const photos = await Promise.all(rows.map((r) => toPublicPhoto(services, r)));
    const body: PhotoListResponse = { photos };
    return { status: 200, jsonBody: body };
  }
);

app.http('photosList', {
  route: 'photos',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: photosListHandler
});
