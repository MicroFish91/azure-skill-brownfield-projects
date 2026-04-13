import { useState } from 'react';
import { useAuth } from '../hooks/useAuth.tsx';
import { usePhotos } from '../hooks/usePhotos.ts';
import { useCouple } from '../hooks/useCouple.ts';
import { PhotoCard } from '../components/PhotoCard.tsx';
import { UploadModal } from '../components/UploadModal.tsx';
import { CoupleStatus } from '../components/CoupleStatus.tsx';

export function ScrapbookPage() {
  const { user, logout } = useAuth();
  const { photos, loading, error, uploadPhoto, deletePhoto } = usePhotos();
  const { partner, loading: coupleLoading } = useCouple(user?.coupleId ?? null);
  const [showUpload, setShowUpload] = useState(false);

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={styles.headerLeft}>
          <h1 style={styles.title}>Our Scrapbook</h1>
          <CoupleStatus partner={partner} loading={coupleLoading} />
        </div>
        <div style={styles.headerRight}>
          <span style={styles.greeting}>Hi, {user?.displayName}</span>
          <button onClick={() => setShowUpload(true)} style={styles.uploadButton}>
            + Add Photo
          </button>
          <button onClick={logout} style={styles.logoutButton}>
            Sign Out
          </button>
        </div>
      </header>

      <main style={styles.main}>
        {error && <div style={styles.error}>{error}</div>}

        {loading ? (
          <div style={styles.emptyState}>
            <p>Loading your memories...</p>
          </div>
        ) : photos.length === 0 ? (
          <div style={styles.emptyState}>
            <h2 style={styles.emptyTitle}>No photos yet!</h2>
            <p style={styles.emptyText}>Start your scrapbook by uploading your first photo together.</p>
            <button onClick={() => setShowUpload(true)} style={styles.uploadButton}>
              + Add Your First Photo
            </button>
          </div>
        ) : (
          <div style={styles.grid}>
            {photos.map((photo) => (
              <PhotoCard key={photo.id} photo={photo} onDelete={deletePhoto} />
            ))}
          </div>
        )}
      </main>

      {showUpload && (
        <UploadModal onUpload={uploadPhoto} onClose={() => setShowUpload(false)} />
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    backgroundColor: '#fef7f0',
    fontFamily: "'Georgia', serif",
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 32px',
    backgroundColor: 'white',
    borderBottom: '2px solid #e8d5c4',
    flexWrap: 'wrap',
    gap: '12px',
  },
  headerLeft: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  title: {
    margin: 0,
    color: '#5c3d2e',
    fontSize: '28px',
  },
  greeting: {
    color: '#7c5a46',
    fontSize: '14px',
  },
  uploadButton: {
    padding: '8px 20px',
    backgroundColor: '#8b5e3c',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
    fontFamily: "'Georgia', serif",
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: 'transparent',
    color: '#a08070',
    border: '1px solid #d4b896',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '13px',
  },
  main: {
    padding: '32px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '20px',
    fontSize: '14px',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '60px 20px',
    color: '#7c5a46',
  },
  emptyTitle: {
    color: '#5c3d2e',
    marginBottom: '8px',
  },
  emptyText: {
    marginBottom: '20px',
    color: '#a08070',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '24px',
  },
};
