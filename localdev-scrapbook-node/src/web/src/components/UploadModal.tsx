import { useState, useRef, type FormEvent } from 'react';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

interface UploadModalProps {
  onUpload: (file: File, caption?: string) => Promise<void>;
  onClose: () => void;
}

function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return 'Invalid file type. Use JPEG, PNG, or WebP.';
  if (file.size > MAX_FILE_SIZE) return 'File too large (max 10 MB).';
  return null;
}

export default function UploadModal({ onUpload, onClose }: UploadModalProps) {
  const [caption, setCaption] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      setSelectedFile(null);
      setPreview(null);
      return;
    }
    setError(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onload = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setError('Please select a photo.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      await onUpload(selectedFile, caption || undefined);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div style={{ background: 'white', padding: 24, borderRadius: 12, maxWidth: 500, width: '90%' }}>
        <h2 style={{ margin: '0 0 16px 0' }}>Upload Photo 📸</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFileChange}
              style={{ width: '100%' }}
            />
          </div>
          {preview && (
            <img
              src={preview}
              alt="Preview"
              style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8, marginBottom: 16 }}
            />
          )}
          <div style={{ marginBottom: 16 }}>
            <label htmlFor="caption" style={{ display: 'block', marginBottom: 4, fontWeight: 500 }}>
              Caption (optional — AI will generate one if left blank)
            </label>
            <input
              id="caption"
              type="text"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Leave blank for AI-generated caption"
              style={{ width: '100%', padding: 8, fontSize: 14, boxSizing: 'border-box' }}
            />
          </div>
          {error && (
            <div style={{ color: 'red', marginBottom: 12, padding: 8, background: '#fff0f0', borderRadius: 4 }}>
              {error}
            </div>
          )}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{ padding: '8px 20px', border: '1px solid #ddd', borderRadius: 6, cursor: 'pointer', background: 'white' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !selectedFile}
              style={{
                padding: '8px 20px',
                background: '#4f46e5',
                color: 'white',
                border: 'none',
                borderRadius: 6,
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading || !selectedFile ? 0.7 : 1,
              }}
            >
              {loading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
