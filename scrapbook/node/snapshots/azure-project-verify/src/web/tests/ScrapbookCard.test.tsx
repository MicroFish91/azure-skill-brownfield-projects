import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Photo } from '@app/shared';
import { ScrapbookCard } from '../src/components/ScrapbookCard.js';

const photo: Photo = {
  id: 'p1',
  coupleId: 'c1',
  uploaderId: 'u1',
  blobPath: 'p1',
  contentType: 'image/jpeg',
  caption: 'Sunset memories',
  captionSource: 'ai',
  url: 'https://example.com/p.jpg',
  createdAt: '2026-02-14T18:00:00.000Z'
};

describe('<ScrapbookCard>', () => {
  let onDelete = () => {};
  beforeEach(() => { onDelete = () => {}; });

  it('renders the caption and image', () => {
    render(<ScrapbookCard photo={photo} onDelete={onDelete} />);
    expect(screen.getByText('Sunset memories')).toBeInTheDocument();
    expect(screen.getByRole('img')).toHaveAttribute('src', photo.url);
  });

  it('shows the AI caption marker for AI captions', () => {
    render(<ScrapbookCard photo={photo} onDelete={onDelete} />);
    expect(screen.getByText(/AI caption/i)).toBeInTheDocument();
  });

  it('omits the AI marker for fallback captions', () => {
    render(<ScrapbookCard photo={{ ...photo, captionSource: 'fallback' }} onDelete={onDelete} />);
    expect(screen.queryByText(/AI caption/i)).not.toBeInTheDocument();
  });

  it('invokes onDelete when the delete button is clicked', async () => {
    let called = 0;
    render(<ScrapbookCard photo={photo} onDelete={() => { called++; }} />);
    await userEvent.click(screen.getByRole('button', { name: /Remove photo p1/i }));
    expect(called).toBe(1);
  });
});
