import { app, type HttpRequest, type HttpResponseInit } from '@azure/functions';

const spec = {
  openapi: '3.0.3',
  info: { title: 'Couples Scrapbook API', version: '0.1.0' },
  servers: [{ url: '/api' }],
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        responses: { '200': { description: 'Healthy / degraded' }, '503': { description: 'Unhealthy' } }
      }
    },
    '/me': {
      get: { summary: 'Current user', security: [{ bearerAuth: [] }], responses: { '200': { description: 'OK' } } }
    },
    '/couple': {
      get: { summary: 'Get caller couple (auto-creates if missing)', security: [{ bearerAuth: [] }] }
    },
    '/couple/pair': {
      post: {
        summary: 'Pair with partner via invite code',
        security: [{ bearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object', required: ['inviteCode'], properties: { inviteCode: { type: 'string' } } }
            }
          }
        }
      }
    },
    '/photos': {
      get: { summary: 'List photos', security: [{ bearerAuth: [] }] },
      post: {
        summary: 'Upload photo (multipart or raw image)',
        security: [{ bearerAuth: [] }]
      }
    },
    '/photos/{id}': {
      delete: {
        summary: 'Delete a photo',
        security: [{ bearerAuth: [] }],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }]
      }
    }
  },
  components: {
    securitySchemes: { bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' } }
  }
};

export const openapiHandler = async (_req: HttpRequest): Promise<HttpResponseInit> => ({
  status: 200,
  jsonBody: spec
});

app.http('openapi', {
  route: 'openapi.json',
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: openapiHandler
});
