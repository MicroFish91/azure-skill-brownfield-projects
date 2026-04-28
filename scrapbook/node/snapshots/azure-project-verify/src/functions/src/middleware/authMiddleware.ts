import type { HttpRequest, InvocationContext } from '@azure/functions';
import type { User } from '@app/shared';
import { AppError } from '../errors/AppError.js';
import { getServices } from '../services/registry.js';

export interface AuthContext {
  user: User;
}

/**
 * Validate the bearer token, then upsert (find-or-create) the local user
 * record keyed by the Entra object id. Throws AppError on any failure.
 */
export async function authenticate(
  request: HttpRequest,
  _ctx: InvocationContext
): Promise<AuthContext> {
  const services = getServices();
  const principal = await services.auth.validate(request.headers.get('authorization'));

  const existing = await services.users.findByEntraObjectId(principal.entraObjectId);
  if (existing) return { user: existing };

  // Auto-provision on first sign-in.
  try {
    const created = await services.users.create({
      entraObjectId: principal.entraObjectId,
      email: principal.email,
      displayName: principal.displayName
    });
    return { user: created };
  } catch (err) {
    // Race / unique-violation: re-fetch.
    const refetched = await services.users.findByEntraObjectId(principal.entraObjectId);
    if (refetched) return { user: refetched };
    throw AppError.internal(`Failed to provision user: ${(err as Error).message}`);
  }
}
