import { useCallback, useEffect, useState } from 'react';
import type { Couple } from '@app/shared';
import { getClient } from '../api/client.js';

export type CoupleState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'data'; couple: Couple };

export function useCouple() {
  const [state, setState] = useState<CoupleState>({ status: 'loading' });

  const reload = useCallback(async () => {
    setState({ status: 'loading' });
    try {
      const { couple } = await getClient().getCouple();
      setState({ status: 'data', couple });
    } catch (err) {
      setState({ status: 'error', message: (err as Error).message });
    }
  }, []);

  useEffect(() => { void reload(); }, [reload]);

  const pair = useCallback(async (inviteCode: string) => {
    try {
      const { couple } = await getClient().pairCouple(inviteCode);
      setState({ status: 'data', couple });
    } catch (err) {
      setState({ status: 'error', message: (err as Error).message });
      throw err;
    }
  }, []);

  return { state, reload, pair };
}
