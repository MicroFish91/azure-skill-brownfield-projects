import type { Photo } from '../api/client';
import PhotoCard from './PhotoCard';

interface ScrapbookGridProps {
  photos: Photo[];
  currentUserId: string;
  onDelete: (id: string) => void;
}

export default function ScrapbookGrid({ photos, currentUserId, onDelete }: ScrapbookGridProps) {
  if (photos.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: '#888' }}>
        <p style={{ fontSize: 48, marginBottom: 8 }}>📸</p>
        <p style={{ fontSize: 18 }}>No photos yet!</p>
        <p>Upload your first photo to start your scrapbook.</p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
        gap: 24,
        padding: 24,
      }}
    >
      {photos.map((photo) => (
        <PhotoCard
          key={photo.id}
          photo={photo}
          isOwner={photo.uploadedByUserId === currentUserId}
          onDelete={onDelete}
        />
      ))}
    </div>
  );
}
