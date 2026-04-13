import type { User, PublicUser } from 'scrapbook-shared';

export function toPublicUser(user: User): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    coupleId: user.coupleId,
    createdAt: user.createdAt,
  };
}
