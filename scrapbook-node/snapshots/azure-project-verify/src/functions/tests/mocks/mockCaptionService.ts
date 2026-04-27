import type { CaptionResult, ICaptionService } from '../../src/services/interfaces/ICaptionService.js';

export class MockCaptionService implements ICaptionService {
  public shouldFail = false;
  public captionToReturn = 'A sweet test moment';
  public available = true;

  async generate(_image: Buffer, _contentType: string): Promise<CaptionResult> {
    if (this.shouldFail) throw new Error('mock caption failure');
    return { caption: this.captionToReturn, source: 'ai' };
  }

  async ping(): Promise<{ available: boolean; message?: string }> {
    return this.available
      ? { available: true }
      : { available: false, message: 'mock unavailable' };
  }
}
