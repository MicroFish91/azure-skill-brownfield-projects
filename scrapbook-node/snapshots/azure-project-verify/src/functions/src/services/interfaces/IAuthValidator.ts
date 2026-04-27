export interface AuthenticatedPrincipal {
  entraObjectId: string;
  email: string;
  displayName: string;
}

export interface IAuthValidator {
  /**
   * Validate a bearer token. Returns the authenticated principal or throws
   * an AppError.unauthorized() on any failure.
   */
  validate(authorizationHeader: string | null | undefined): Promise<AuthenticatedPrincipal>;
}
