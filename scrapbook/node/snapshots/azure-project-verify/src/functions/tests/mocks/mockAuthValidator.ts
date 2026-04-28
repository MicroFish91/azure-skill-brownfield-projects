import { AppError } from '../../src/errors/AppError.js';
import type {
  AuthenticatedPrincipal,
  IAuthValidator
} from '../../src/services/interfaces/IAuthValidator.js';

/**
 * Test auth validator. Maps any non-empty bearer token to a fixed principal.
 * Use distinct tokens (e.g., 'token-alice', 'token-bob') to simulate
 * different users via setPrincipal().
 */
export class MockAuthValidator implements IAuthValidator {
  private principals = new Map<string, AuthenticatedPrincipal>();
  public defaultPrincipal: AuthenticatedPrincipal = {
    entraObjectId: 'oid-default',
    email: 'default@example.com',
    displayName: 'Default User'
  };

  setPrincipal(token: string, principal: AuthenticatedPrincipal): void {
    this.principals.set(token, principal);
  }

  async validate(authorizationHeader: string | null | undefined): Promise<AuthenticatedPrincipal> {
    if (!authorizationHeader || !authorizationHeader.toLowerCase().startsWith('bearer ')) {
      throw AppError.unauthorized('Missing or malformed Authorization header');
    }
    const token = authorizationHeader.slice(7).trim();
    if (!token) throw AppError.unauthorized('Empty bearer token');
    if (token === 'invalid') throw AppError.unauthorized('Invalid token');
    return this.principals.get(token) ?? this.defaultPrincipal;
  }
}
