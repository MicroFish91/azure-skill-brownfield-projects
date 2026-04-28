import { createRemoteJWKSet, jwtVerify, type JWTPayload } from 'jose';
import type { AppConfig } from '../config.js';
import type {
  AuthenticatedPrincipal,
  IAuthValidator
} from '../interfaces/IAuthValidator.js';
import { AppError } from '../../errors/AppError.js';

export class EntraAuthValidator implements IAuthValidator {
  private jwks: ReturnType<typeof createRemoteJWKSet> | null = null;

  constructor(private readonly config: AppConfig) {}

  private getJwks() {
    if (!this.jwks) {
      const url = new URL(
        `https://login.microsoftonline.com/${this.config.entraTenantId}/discovery/v2.0/keys`
      );
      this.jwks = createRemoteJWKSet(url);
    }
    return this.jwks;
  }

  async validate(authorizationHeader: string | null | undefined): Promise<AuthenticatedPrincipal> {
    if (!authorizationHeader || !authorizationHeader.toLowerCase().startsWith('bearer ')) {
      throw AppError.unauthorized('Missing or malformed Authorization header');
    }
    const token = authorizationHeader.slice(7).trim();
    if (!token) throw AppError.unauthorized('Empty bearer token');

    let payload: JWTPayload;
    try {
      const verified = await jwtVerify(token, this.getJwks(), {
        audience: this.config.entraApiAudience,
        issuer: [
          `https://login.microsoftonline.com/${this.config.entraTenantId}/v2.0`,
          `https://sts.windows.net/${this.config.entraTenantId}/`
        ]
      });
      payload = verified.payload;
    } catch (err) {
      throw AppError.unauthorized(`Invalid token: ${(err as Error).message}`);
    }

    const oid =
      typeof payload.oid === 'string'
        ? payload.oid
        : typeof payload.sub === 'string'
          ? payload.sub
          : null;
    if (!oid) throw AppError.unauthorized('Token missing oid/sub claim');

    const email =
      typeof payload.email === 'string'
        ? payload.email
        : typeof payload.preferred_username === 'string'
          ? payload.preferred_username
          : `${oid}@unknown`;

    const displayName =
      typeof payload.name === 'string' ? payload.name : email.split('@')[0];

    return { entraObjectId: oid, email, displayName };
  }
}
