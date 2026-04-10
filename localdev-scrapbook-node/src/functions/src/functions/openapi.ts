import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { logRequest } from '../middleware/requestLogger';

const openapiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'CoupleSnap API',
    description: 'API for the CoupleSnap couples scrapbook application',
    version: '1.0.0',
  },
  servers: [
    {
      url: '/api',
      description: 'API base path',
    },
  ],
  paths: {
    '/auth/register': {
      post: {
        summary: 'Register a new user',
        operationId: 'register',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'displayName'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string', minLength: 8 },
                  displayName: { type: 'string', minLength: 1 },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'User registered successfully' },
          '409': { description: 'Email already exists' },
          '422': { description: 'Validation error' },
        },
      },
    },
    '/auth/login': {
      post: {
        summary: 'Login',
        operationId: 'login',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', format: 'email' },
                  password: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '200': { description: 'Login successful' },
          '401': { description: 'Invalid credentials' },
        },
      },
    },
    '/auth/me': {
      get: {
        summary: 'Get current user',
        operationId: 'getMe',
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Current user profile' },
          '401': { description: 'Unauthorized' },
        },
      },
    },
    '/invites': {
      post: {
        summary: 'Create an invite',
        operationId: 'createInvite',
        tags: ['Invites'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['toEmail'],
                properties: {
                  toEmail: { type: 'string', format: 'email' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Invite created' },
          '400': { description: 'Bad request' },
          '409': { description: 'Conflict' },
        },
      },
      get: {
        summary: 'List invites',
        operationId: 'listInvites',
        tags: ['Invites'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'type',
            in: 'query',
            schema: { type: 'string', enum: ['sent', 'received'] },
          },
        ],
        responses: {
          '200': { description: 'List of invites' },
        },
      },
    },
    '/invites/{id}/accept': {
      post: {
        summary: 'Accept an invite',
        operationId: 'acceptInvite',
        tags: ['Invites'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Invite accepted, couple created' },
          '404': { description: 'Invite not found' },
        },
      },
    },
    '/couple': {
      get: {
        summary: 'Get couple info',
        operationId: 'getCouple',
        tags: ['Couple'],
        security: [{ bearerAuth: [] }],
        responses: {
          '200': { description: 'Couple info with partner' },
          '404': { description: 'Not in a couple' },
        },
      },
    },
    '/photos': {
      post: {
        summary: 'Upload a photo',
        operationId: 'uploadPhoto',
        tags: ['Photos'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['file'],
                properties: {
                  file: { type: 'string', format: 'binary' },
                  caption: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          '201': { description: 'Photo uploaded' },
          '400': { description: 'Bad request' },
          '422': { description: 'Validation error' },
        },
      },
      get: {
        summary: 'List photos',
        operationId: 'listPhotos',
        tags: ['Photos'],
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: 'limit', in: 'query', schema: { type: 'integer', default: 20 } },
          { name: 'offset', in: 'query', schema: { type: 'integer', default: 0 } },
        ],
        responses: {
          '200': { description: 'Paginated list of photos' },
        },
      },
    },
    '/photos/{id}': {
      get: {
        summary: 'Get a photo',
        operationId: 'getPhoto',
        tags: ['Photos'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Photo details' },
          '404': { description: 'Photo not found' },
        },
      },
      delete: {
        summary: 'Delete a photo',
        operationId: 'deletePhoto',
        tags: ['Photos'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            schema: { type: 'string', format: 'uuid' },
          },
        ],
        responses: {
          '200': { description: 'Photo deleted' },
          '403': { description: 'Forbidden' },
          '404': { description: 'Photo not found' },
        },
      },
    },
    '/health': {
      get: {
        summary: 'Health check',
        operationId: 'health',
        tags: ['System'],
        responses: {
          '200': { description: 'Service healthy or degraded' },
          '503': { description: 'Service unhealthy' },
        },
      },
    },
    '/openapi.json': {
      get: {
        summary: 'OpenAPI specification',
        operationId: 'openapi',
        tags: ['System'],
        responses: {
          '200': { description: 'OpenAPI 3.0 specification' },
        },
      },
    },
  },
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
};

app.http('openapi', {
  methods: ['GET'],
  authLevel: 'anonymous',
  route: 'openapi.json',
  handler: async (request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const startTime = Date.now();
    logRequest(request, context, startTime);
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      jsonBody: openapiSpec,
    };
  },
});
