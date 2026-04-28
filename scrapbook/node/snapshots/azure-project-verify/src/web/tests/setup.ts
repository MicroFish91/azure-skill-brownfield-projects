import '@testing-library/jest-dom/vitest';

// jsdom doesn't implement URL.createObjectURL — stub it for tests that exercise
// preview-mode file uploads.
if (typeof URL.createObjectURL !== 'function') {
  // @ts-expect-error: stubbing browser API in jsdom
  URL.createObjectURL = () => 'blob:mock';
}
if (typeof URL.revokeObjectURL !== 'function') {
  // @ts-expect-error: stubbing browser API in jsdom
  URL.revokeObjectURL = () => undefined;
}
