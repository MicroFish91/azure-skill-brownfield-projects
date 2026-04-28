import { describe, it, expect } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UploadDropzone } from '../src/components/UploadDropzone.js';

function makeFile(name: string, type: string, sizeBytes: number): File {
  const f = new File([new Uint8Array(sizeBytes)], name, { type });
  return f;
}

describe('<UploadDropzone>', () => {
  it('accepts a valid JPEG and calls onSelect', async () => {
    let received: File | null = null;
    render(<UploadDropzone onSelect={(f) => { received = f; }} />);

    const input = document.querySelector('input[type="file"]')! as HTMLInputElement;
    const file = makeFile('photo.jpg', 'image/jpeg', 1024);
    await userEvent.upload(input, file);

    await waitFor(() => expect(received).not.toBeNull());
    expect(received!.name).toBe('photo.jpg');
  });

  it('rejects unsupported MIME types and shows an error', async () => {
    let called = false;
    render(<UploadDropzone onSelect={() => { called = true; }} />);

    const input = document.querySelector('input[type="file"]')! as HTMLInputElement;
    await userEvent.upload(input, makeFile('doc.pdf', 'application/pdf', 1024), {
      applyAccept: false
    });

    expect(await screen.findByText(/Unsupported type/i)).toBeInTheDocument();
    expect(called).toBe(false);
  });

  it('rejects oversized files and shows an error', async () => {
    let called = false;
    render(<UploadDropzone onSelect={() => { called = true; }} />);

    const input = document.querySelector('input[type="file"]')! as HTMLInputElement;
    await userEvent.upload(input, makeFile('big.jpg', 'image/jpeg', 11 * 1024 * 1024));

    expect(await screen.findByText(/too large/i)).toBeInTheDocument();
    expect(called).toBe(false);
  });
});
