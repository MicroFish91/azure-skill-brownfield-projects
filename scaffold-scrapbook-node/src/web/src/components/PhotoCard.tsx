import type { Photo } from 'scrapbook-shared';

interface PhotoCardProps {
  photo: Photo;
  onDelete: (id: string) => void;
}

export function PhotoCard({ photo, onDelete }: PhotoCardProps) {
  const handleDelete = () => {
    if (window.confirm('Delete this photo? This cannot be undone.')) {
      onDelete(photo.id);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.imageWrapper}>
        <img src={photo.blobUrl} alt={photo.caption || 'Photo'} style={styles.image} />
      </div>
      <div style={styles.content}>
        {photo.caption && <p style={styles.caption}>"{photo.caption}"</p>}
        <div style={styles.footer}>
          <span style={styles.date}>
            {new Date(photo.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
          <button onClick={handleDelete} style={styles.deleteButton} title="Delete photo">
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: 'white',
    borderRadius: '8px',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
    transform: `rotate(${Math.random() * 4 - 2}deg)`,
    transition: 'transform 0.2s ease',
    border: '8px solid white',
    outline: '1px solid #e8d5c4',
  },
  imageWrapper: {
    width: '100%',
    aspectRatio: '4/3',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    display: 'block',
  },
  content: {
    padding: '12px 8px 8px',
  },
  caption: {
    fontFamily: "'Georgia', serif",
    fontSize: '14px',
    color: '#5c3d2e',
    fontStyle: 'italic',
    margin: '0 0 8px 0',
    lineHeight: '1.4',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  date: {
    fontSize: '11px',
    color: '#a08070',
    fontFamily: "'Georgia', serif",
  },
  deleteButton: {
    background: 'none',
    border: 'none',
    color: '#cbb5a5',
    cursor: 'pointer',
    fontSize: '14px',
    padding: '2px 6px',
    borderRadius: '4px',
  },
};
