import type { Photo } from '@app/shared';

interface Props {
  photo: Photo;
  onDelete: () => void;
}

export function ScrapbookCard({ photo, onDelete }: Props) {
  return (
    <article className="scrapbook-card" data-testid={`card-${photo.id}`}>
      <button
        className="delete"
        aria-label={`Remove photo ${photo.id}`}
        onClick={onDelete}
      >
        ✕
      </button>
      <img src={photo.url} alt={photo.caption} loading="lazy" />
      <p className="caption">{photo.caption}</p>
      <div className="meta">
        <span>{new Date(photo.createdAt).toLocaleDateString()}</span>
        <span>{photo.captionSource === 'ai' ? '✨ AI caption' : 'caption'}</span>
      </div>
    </article>
  );
}
