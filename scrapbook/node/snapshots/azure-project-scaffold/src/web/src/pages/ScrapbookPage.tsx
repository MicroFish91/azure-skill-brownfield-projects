import { Link } from 'react-router-dom';
import { useAuth } from '../auth/AuthProvider.js';
import { useCouple } from '../hooks/useCouple.js';
import { usePhotos } from '../hooks/usePhotos.js';
import { ScrapbookGrid } from '../components/ScrapbookGrid.js';
import { UploadDropzone } from '../components/UploadDropzone.js';

export function ScrapbookPage() {
  const { user, signOut } = useAuth();
  const couple = useCouple();
  const photos = usePhotos();

  return (
    <div className="app-shell">
      <header className="app-header">
        <h1 className="app-title">Our Scrapbook</h1>
        <div className="app-user">
          {user?.displayName} ·{' '}
          <Link to="/pair" style={{ color: 'inherit' }}>Pair</Link> ·{' '}
          <button className="ghost" onClick={signOut} style={{ marginLeft: '0.5rem' }}>
            Sign out
          </button>
        </div>
      </header>

      {couple.state.status === 'data' && couple.state.couple.members.length < 2 && (
        <div className="error" role="alert">
          You're not paired yet — share your invite code on the{' '}
          <Link to="/pair">pair page</Link>.
        </div>
      )}

      <UploadDropzone
        onSelect={async (file) => {
          try { await photos.upload(file); }
          catch (e) { window.alert(`Upload failed: ${(e as Error).message}`); }
        }}
      />

      <ScrapbookGrid
        state={photos.state}
        onDelete={async (id) => {
          if (!window.confirm('Remove this photo from the scrapbook?')) return;
          try { await photos.remove(id); }
          catch (e) { window.alert(`Delete failed: ${(e as Error).message}`); }
        }}
      />
    </div>
  );
}
