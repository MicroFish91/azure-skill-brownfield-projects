import { useRef, useState } from 'react';
import { ALLOWED_PHOTO_MIME_TYPES, MAX_PHOTO_SIZE_BYTES } from '@app/shared';

interface Props {
  onSelect: (file: File) => void | Promise<void>;
}

export function UploadDropzone({ onSelect }: Props) {
  const ref = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handle = async (file: File | null | undefined) => {
    setError(null);
    if (!file) return;
    if (!(ALLOWED_PHOTO_MIME_TYPES as readonly string[]).includes(file.type)) {
      setError(`Unsupported type: ${file.type || 'unknown'}`);
      return;
    }
    if (file.size > MAX_PHOTO_SIZE_BYTES) {
      setError('Photo is too large (max 10 MB)');
      return;
    }
    await onSelect(file);
  };

  return (
    <label
      className={`upload-dropzone${drag ? ' drag' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={async (e) => {
        e.preventDefault();
        setDrag(false);
        await handle(e.dataTransfer.files?.[0]);
      }}
    >
      <strong>Drop a photo</strong> here, or click to choose one.<br />
      <span style={{ fontSize: '0.85rem', opacity: 0.7 }}>
        JPEG, PNG, WEBP, or GIF · up to 10 MB
      </span>
      {error && <div className="error" style={{ marginTop: '0.75rem' }}>{error}</div>}
      <input
        ref={ref}
        type="file"
        accept={(ALLOWED_PHOTO_MIME_TYPES as readonly string[]).join(',')}
        onChange={async (e) => {
          await handle(e.target.files?.[0]);
          if (ref.current) ref.current.value = '';
        }}
      />
    </label>
  );
}
