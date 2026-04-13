import { useState, useRef } from 'react';

interface UploadModalProps {
  onUpload: (file: File) => Promise<void>;
  onClose: () => void;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

export function UploadModal({ onUpload, onClose }: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    setError(null);

    if (!ALLOWED_TYPES.includes(selected.type)) {
      setError('Please select a JPEG, PNG, GIF, or WebP image.');
      return;
    }

    if (selected.size > MAX_FILE_SIZE) {
      setError('File size must be under 10MB.');
      return;
    }

    setFile(selected);
    setPreview(URL.createObjectURL(selected));
  };

  const handleUpload = async () => {
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      await onUpload(file);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h2 style={styles.title}>Add a Memory</h2>
        {error && <div style={styles.error}>{error}</div>}

        {!preview ? (
          <div
            style={styles.dropzone}
            onClick={() => fileInputRef.current?.click()}
          >
            <p style={styles.dropText}>Click to select a photo</p>
            <p style={styles.dropHint}>JPEG, PNG, GIF, or WebP — up to 10MB</p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/gif,image/webp"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </div>
        ) : (
          <div style={styles.previewContainer}>
            <img src={preview} alt="Preview" style={styles.previewImage} />
          </div>
        )}

        <div style={styles.actions}>
          <button onClick={onClose} style={styles.cancelButton} disabled={uploading}>
            Cancel
          </button>
          <button
            onClick={handleUpload}
            style={styles.uploadButton}
            disabled={!file || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    inset: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '32px',
    width: '100%',
    maxWidth: '460px',
    boxShadow: '0 8px 30px rgba(0,0,0,0.15)',
  },
  title: {
    color: '#5c3d2e',
    fontFamily: "'Georgia', serif",
    margin: '0 0 20px 0',
    textAlign: 'center' as const,
  },
  error: {
    backgroundColor: '#fee2e2',
    color: '#b91c1c',
    padding: '10px 14px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px',
  },
  dropzone: {
    border: '2px dashed #d4b896',
    borderRadius: '8px',
    padding: '40px 20px',
    textAlign: 'center' as const,
    cursor: 'pointer',
    backgroundColor: '#fef7f0',
  },
  dropText: {
    color: '#8b5e3c',
    fontSize: '16px',
    margin: '0 0 4px 0',
  },
  dropHint: {
    color: '#a08070',
    fontSize: '12px',
    margin: 0,
  },
  previewContainer: {
    borderRadius: '8px',
    overflow: 'hidden',
    marginBottom: '16px',
  },
  previewImage: {
    width: '100%',
    maxHeight: '300px',
    objectFit: 'cover' as const,
    display: 'block',
  },
  actions: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px',
  },
  cancelButton: {
    flex: 1,
    padding: '10px',
    border: '2px solid #e8d5c4',
    backgroundColor: 'white',
    color: '#7c5a46',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
  },
  uploadButton: {
    flex: 1,
    padding: '10px',
    border: 'none',
    backgroundColor: '#8b5e3c',
    color: 'white',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600' as const,
  },
};
