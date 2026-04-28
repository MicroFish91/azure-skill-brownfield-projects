import { randomUUID } from 'node:crypto';
import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import type { PhotoResponse } from '@app/shared';
import { photoUploadMetaSchema } from '@app/shared';
import { authenticate } from '../middleware/authMiddleware.js';
import { withErrors } from '../middleware/errorMiddleware.js';
import { AppError } from '../errors/AppError.js';
import { getServices } from '../services/registry.js';
import { toPublicPhoto } from '../utils/toPublicPhoto.js';

const FALLBACK_CAPTION_TEXT = 'A new memory ✨';

/**
 * Upload a photo. Accepts either:
 *   - multipart/form-data with a `file` field
 *   - any image/* content-type with the raw bytes as the body
 *
 * Caption generation is best-effort (Enhancement). On AI failure we save
 * the photo with a fallback caption rather than 5xx-ing.
 */
export const photosUploadHandler = withErrors(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const services = getServices();
    const { user } = await authenticate(req, ctx);
    if (!user.coupleId) {
      throw AppError.forbidden('You must be paired with a partner before uploading photos');
    }

    const { buffer, contentType } = await readPhoto(req);
    photoUploadMetaSchema.parse({ contentType, size: buffer.byteLength });

    const blobPath = `${user.coupleId}/${Date.now()}-${randomUUID()}`;
    await services.blob.upload(blobPath, buffer, contentType);

    let caption = FALLBACK_CAPTION_TEXT;
    let captionSource: 'ai' | 'fallback' = 'fallback';
    try {
      const result = await services.captions.generate(buffer, contentType);
      caption = result.caption;
      captionSource = result.source;
    } catch {
      // Enhancement service failed: keep fallback.
    }

    const row = await services.photos.create({
      coupleId: user.coupleId,
      uploaderId: user.id,
      blobPath,
      contentType,
      caption,
      captionSource
    });

    const body: PhotoResponse = { photo: await toPublicPhoto(services, row) };
    return { status: 201, jsonBody: body };
  }
);

async function readPhoto(req: HttpRequest): Promise<{ buffer: Buffer; contentType: string }> {
  const ct = (req.headers.get('content-type') ?? '').toLowerCase();

  if (ct.startsWith('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('file');
    if (!(file && typeof file !== 'string')) {
      throw AppError.badRequest('multipart upload missing "file" field');
    }
    const ab = await file.arrayBuffer();
    return { buffer: Buffer.from(ab), contentType: file.type || 'application/octet-stream' };
  }

  if (ct.startsWith('image/')) {
    const ab = await req.arrayBuffer();
    return { buffer: Buffer.from(ab), contentType: ct.split(';')[0].trim() };
  }

  throw AppError.badRequest(
    'Upload must be multipart/form-data with a "file" field or an image/* body'
  );
}

app.http('photosUpload', {
  route: 'photos',
  methods: ['POST'],
  authLevel: 'anonymous',
  handler: photosUploadHandler
});
