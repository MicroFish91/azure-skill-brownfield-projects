import { IAICaptionService } from '../../src/services/interfaces/IAICaptionService';

export class MockAICaptionService implements IAICaptionService {
  public shouldFail = false;
  public lastCaption = 'A lovely couple photo together 💕';

  async generateCaption(_imageBuffer: Buffer, _mimeType: string): Promise<string> {
    if (this.shouldFail) {
      throw new Error('AI caption service unavailable');
    }
    return this.lastCaption;
  }

  async healthCheck(): Promise<boolean> {
    return !this.shouldFail;
  }
}
