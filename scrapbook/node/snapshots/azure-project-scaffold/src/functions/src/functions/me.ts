import { app, type HttpRequest, type HttpResponseInit, type InvocationContext } from '@azure/functions';
import type { MeResponse } from '@app/shared';
import { authenticate } from '../middleware/authMiddleware.js';
import { withErrors } from '../middleware/errorMiddleware.js';

export const meHandler = withErrors(
  async (req: HttpRequest, ctx: InvocationContext): Promise<HttpResponseInit> => {
    const { user } = await authenticate(req, ctx);
    const body: MeResponse = { user };
    return { status: 200, jsonBody: body };
  }
);

app.http('me', {
  route: 'me',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: meHandler
});
