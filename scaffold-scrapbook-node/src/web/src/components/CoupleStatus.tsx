import type { PublicUser } from 'scrapbook-shared';

interface CoupleStatusProps {
  partner: PublicUser | null;
  loading: boolean;
}

export function CoupleStatus({ partner, loading }: CoupleStatusProps) {
  if (loading) {
    return <span style={styles.loading}>Loading...</span>;
  }

  if (!partner) {
    return <span style={styles.noPair}>Not paired yet</span>;
  }

  return (
    <span style={styles.paired}>
      Paired with <strong>{partner.displayName}</strong>
    </span>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loading: { color: '#a08070', fontSize: '14px' },
  noPair: { color: '#a08070', fontSize: '14px', fontStyle: 'italic' },
  paired: { color: '#5c3d2e', fontSize: '14px', fontFamily: "'Georgia', serif" },
};
