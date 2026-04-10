import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { usePhotos } from '../hooks/usePhotos';
import { useCouple } from '../hooks/useCouple';
import ScrapbookGrid from '../components/ScrapbookGrid';
import UploadModal from '../components/UploadModal';

export default function ScrapbookPage() {
  const { user, logout } = useAuth();
  const { photos, loading, error, uploadPhoto, deletePhoto } = usePhotos();
  const { couple } = useCouple();
  const [showUpload, setShowUpload] = useState(false);

  if (!user) return null;

  return (
    <div style={{ fontFamily: 'system-ui', minHeight: '100vh', background: '#faf9f6' }}>
      {/* Header */}
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '12px 24px',
          background: 'white',
          borderBottom: '1px solid #eee',
        }}
      >
        <h1 style={{ margin: 0, fontSize: 22 }}>💕 CoupleSnap</h1>
        <nav style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          {couple && (
            <button
              onClick={() => setShowUpload(true)}
              style={{
                padding: '8px 16px',
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                fontSize: 14,
              }}
            >
              📷 Upload
            </button>
          )}
          <a href="/invite" style={{ color: '#4f46e5', textDecoration: 'none', fontSize: 14 }}>
            {couple ? '💌 Invites' : '💌 Find Partner'}
          </a>
          <a href="/profile" style={{ color: '#4f46e5', textDecoration: 'none', fontSize: 14 }}>
            👤 {user.displayName}
          </a>
          <button
            onClick={logout}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#888', fontSize: 14 }}
          >
            Logout
          </button>
        </nav>
      </header>

      {/* Content */}
      <main style={{ maxWidth: 1200, margin: '0 auto' }}>
        {!couple ? (
          <div style={{ textAlign: 'center', padding: 60 }}>
            <p style={{ fontSize: 48, marginBottom: 8 }}>💌</p>
            <h2>You're not paired yet!</h2>
            <p style={{ color: '#666' }}>
              Send an invite to your partner to start your shared scrapbook.
            </p>
            <a
              href="/invite"
              style={{
                display: 'inline-block',
                marginTop: 16,
                padding: '12px 24px',
                background: '#4f46e5',
                color: 'white',
                textDecoration: 'none',
                borderRadius: 6,
              }}
            >
              Send Invite
            </a>
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>Loading your scrapbook...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#ef4444' }}>
            <p>Something went wrong: {error}</p>
          </div>
        ) : (
          <>
            <div style={{ textAlign: 'center', padding: '24px 0 0' }}>
              <h2 style={{ fontFamily: "'Georgia', serif", color: '#333' }}>
                Our Scrapbook 📖
              </h2>
              {couple.partner && (
                <p style={{ color: '#888' }}>
                  with {couple.partner.displayName} · {photos.length} memories
                </p>
              )}
            </div>
            <ScrapbookGrid photos={photos} currentUserId={user.id} onDelete={deletePhoto} />
          </>
        )}
      </main>

      {showUpload && (
        <UploadModal
          onUpload={async (file, caption) => {
            await uploadPhoto(file, caption);
          }}
          onClose={() => setShowUpload(false)}
        />
      )}
    </div>
  );
}
