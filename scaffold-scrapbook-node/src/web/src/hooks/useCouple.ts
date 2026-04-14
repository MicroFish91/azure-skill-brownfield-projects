import { useState, useEffect } from 'react';
import type { Couple, PublicUser } from 'scrapbook-shared';
import { api, ApiError } from '../api/client.ts';

export function useCouple(coupleId: string | null) {
  const [couple, setCouple] = useState<Couple | null>(null);
  const [partner, setPartner] = useState<PublicUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!coupleId) {
      setCouple(null);
      setPartner(null);
      return;
    }

    setLoading(true);
    setError(null);
    api.getCouple(coupleId)
      .then((result) => {
        setCouple(result.couple);
        const otherUser = result.users.find((u) => u.id !== result.couple.user1Id) ?? result.users[1];
        setPartner(otherUser ?? null);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 404) {
          return;
        }
        setError(err instanceof Error ? err.message : 'Failed to load couple info');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [coupleId]);

  return { couple, partner, loading, error };
}
