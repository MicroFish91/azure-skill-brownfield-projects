import type { PhotosState } from '../hooks/usePhotos.js';
import { ScrapbookCard } from './ScrapbookCard.js';

interface Props {
  state: PhotosState;
  onDelete: (id: string) => void;
}

export function ScrapbookGrid({ state, onDelete }: Props) {
  if (state.status === 'loading') return <p className="empty-state">Loading your memories…</p>;
  if (state.status === 'error')   return <p className="empty-state">Couldn't load photos: {state.message}</p>;
  if (state.status === 'empty')   return <p className="empty-state">No photos yet — upload one to start your scrapbook.</p>;

  return (
    <div className="scrapbook-grid" data-testid="scrapbook-grid">
      {state.photos.map((p) => (
        <ScrapbookCard key={p.id} photo={p} onDelete={() => onDelete(p.id)} />
      ))}
    </div>
  );
}
