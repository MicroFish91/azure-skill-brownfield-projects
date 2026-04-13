import type { HttpRequest } from '@azure/functions';
import type { ZodSchema } from 'zod';

export async function validateBody<T>(request: HttpRequest, schema: ZodSchema<T>): Promise<T> {
  const body = await request.json();
  return schema.parse(body);
}

export function validateQuery<T>(request: HttpRequest, schema: ZodSchema<T>): T {
  const query: Record<string, string> = {};
  request.query.forEach((value, key) => {
    query[key] = value;
  });
  return schema.parse(query);
}

export function validateParams<T>(params: Record<string, string>, schema: ZodSchema<T>): T {
  return schema.parse(params);
}
