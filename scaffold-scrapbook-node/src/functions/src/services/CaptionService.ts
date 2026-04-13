import type { ICaptionService } from './interfaces/ICaptionService.js';
import { logger } from '../logger.js';

export class CaptionService implements ICaptionService {
  private endpoint: string;
  private apiKey: string;

  constructor(endpoint?: string, apiKey?: string) {
    this.endpoint = endpoint ?? '';
    this.apiKey = apiKey ?? '';
  }

  async generateCaption(imageBuffer: Buffer): Promise<string> {
    if (!this.endpoint || !this.apiKey) {
      logger.warn('Azure OpenAI not configured — returning empty caption');
      return '';
    }

    try {
      const base64Image = imageBuffer.toString('base64');
      const response = await fetch(`${this.endpoint}/openai/deployments/gpt-4o/chat/completions?api-version=2024-02-01`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': this.apiKey,
        },
        body: JSON.stringify({
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'Write a short, sweet scrapbook caption for this photo. Keep it under 20 words, warm and personal.',
                },
                {
                  type: 'image_url',
                  image_url: { url: `data:image/jpeg;base64,${base64Image}` },
                },
              ],
            },
          ],
          max_tokens: 60,
        }),
      });

      if (!response.ok) {
        logger.warn({ status: response.status }, 'Azure OpenAI returned non-OK status');
        return '';
      }

      const data = await response.json() as { choices: Array<{ message: { content: string } }> };
      return data.choices?.[0]?.message?.content?.trim() ?? '';
    } catch (error) {
      logger.warn({ err: error }, 'Failed to generate caption — falling back to empty');
      return '';
    }
  }

  async healthCheck(): Promise<boolean> {
    return Boolean(this.endpoint && this.apiKey);
  }
}

export class NoOpCaptionService implements ICaptionService {
  async generateCaption(_imageBuffer: Buffer): Promise<string> {
    return '';
  }

  async healthCheck(): Promise<boolean> {
    return false;
  }
}
