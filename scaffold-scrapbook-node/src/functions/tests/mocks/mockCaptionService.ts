import type { ICaptionService } from '../../src/services/interfaces/ICaptionService.js';

export class MockCaptionService implements ICaptionService {
  private defaultCaption: string;
  private shouldFail: boolean;

  constructor(options?: { defaultCaption?: string; shouldFail?: boolean }) {
    this.defaultCaption = options?.defaultCaption ?? 'A beautiful moment captured!';
    this.shouldFail = options?.shouldFail ?? false;
  }

  async generateCaption(_imageBuffer: Buffer): Promise<string> {
    if (this.shouldFail) {
      throw new Error('Caption service unavailable');
    }
    return this.defaultCaption;
  }

  async healthCheck(): Promise<boolean> {
    return !this.shouldFail;
  }
}
