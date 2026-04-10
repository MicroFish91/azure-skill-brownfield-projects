import { useState } from 'react';
import type { Photo } from '../api/client';
import ConfirmDialog from './ConfirmDialog';

interface PhotoCardProps {
  photo: Photo;
  isOwner: boolean;
  onDelete: (id: string) => void;
}

export default function PhotoCard({ photo, isOwner, onDelete }: PhotoCardProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div
      style={{
        background: '#fffef7',
        borderRadius: 8,
        boxShadow: '2px 3px 12px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        transform: `rotate(${(Math.random() - 0.5) * 4}deg)`,
        transition: 'transform 0.2s',
      }}
    >
      <img
        src={photo.blobUrl}
        alt={photo.caption}
        style={{ width: '100%', height: 200, objectFit: 'cover' }}
      />
      <div style={{ padding: 12 }}>
        <p
          style={{
            fontFamily: "'Georgia', serif",
            fontStyle: 'italic',
            fontSize: 14,
            color: '#555',
            margin: '0 0 8px 0',
          }}
        >
          "{photo.caption}"
        </p>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 11, color: '#999' }}>
            {new Date(photo.createdAt).toLocaleDateString()}
          </span>
          {isOwner && (
            <button
              onClick={() => setShowConfirm(true)}
              style={{
                fontSize: 11,
                color: '#ef4444',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>
      {showConfirm && (
        <ConfirmDialog
          message="Delete this photo? This cannot be undone."
          onConfirm={() => {
            onDelete(photo.id);
            setShowConfirm(false);
          }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
