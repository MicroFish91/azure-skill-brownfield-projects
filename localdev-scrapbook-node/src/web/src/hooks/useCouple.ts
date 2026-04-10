import { useState, useCallback, useEffect } from 'react';
import { api, type Couple, type PublicUser } from '../api/client';

export function useCouple() {
  const [couple, setCouple] = useState<(Couple & { partner: PublicUser }) | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCouple = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getCouple();
      setCouple(res.couple);
    } catch (err: unknown) {
      const e = err as Error & { status?: number };
      if (e.status === 404) {
        setCouple(null);
      } else {
        setError(e.message || 'Failed to load couple info');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCouple();
  }, [loadCouple]);

  return { couple, loading, error, loadCouple };
}
