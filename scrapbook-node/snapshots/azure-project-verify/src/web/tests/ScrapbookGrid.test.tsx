import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ScrapbookGrid } from '../src/components/ScrapbookGrid.js';
import type { Photo } from '@app/shared';

const samplePhoto: Photo = {
  id: 'p1', coupleId: 'c1', uploaderId: 'u1', blobPath: 'p1',
  contentType: 'image/jpeg', caption: 'Hi', captionSource: 'ai',
  url: 'https://example.com/p1.jpg', createdAt: '2026-01-01T00:00:00.000Z'
};

describe('<ScrapbookGrid>', () => {
  const noop = () => {};

  it('shows loading state', () => {
    render(<ScrapbookGrid state={{ status: 'loading' }} onDelete={noop} />);
    expect(screen.getByText(/Loading your memories/i)).toBeInTheDocument();
  });

  it('shows error state with the message', () => {
    render(<ScrapbookGrid state={{ status: 'error', message: 'boom' }} onDelete={noop} />);
    expect(screen.getByText(/boom/)).toBeInTheDocument();
  });

  it('shows empty state', () => {
    render(<ScrapbookGrid state={{ status: 'empty' }} onDelete={noop} />);
    expect(screen.getByText(/No photos yet/i)).toBeInTheDocument();
  });

  it('renders one card per photo when there is data', () => {
    render(
      <ScrapbookGrid
        state={{ status: 'data', photos: [samplePhoto, { ...samplePhoto, id: 'p2', caption: 'Two' }] }}
        onDelete={noop}
      />
    );
    expect(screen.getByTestId('scrapbook-grid')).toBeInTheDocument();
    expect(screen.getByTestId('card-p1')).toBeInTheDocument();
    expect(screen.getByTestId('card-p2')).toBeInTheDocument();
    expect(screen.getByText('Two')).toBeInTheDocument();
  });
});
