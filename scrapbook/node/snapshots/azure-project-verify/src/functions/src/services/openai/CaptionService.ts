import type { AppConfig } from '../config.js';
import { isAzureOpenAiConfigured } from '../config.js';
import type { CaptionResult, ICaptionService } from '../interfaces/ICaptionService.js';
import { logger } from '../../lib/logger.js';

const FALLBACK_CAPTION = 'A new memory ✨';

/**
 * Caption service backed by Azure OpenAI vision.
 *
 * Enhancement service: this constructor MUST NOT throw if Azure OpenAI
 * config is missing. generate() returns a fallback caption in that case.
 */
export class AzureOpenAiCaptionService implements ICaptionService {
  constructor(private readonly config: AppConfig) {}

  async generate(image: Buffer, contentType: string): Promise<CaptionResult> {
    if (!isAzureOpenAiConfigured(this.config)) {
      logger.warn({ reason: 'not_configured' }, 'caption: using fallback');
      return { caption: FALLBACK_CAPTION, source: 'fallback' };
    }
    try {
      const dataUrl = `data:${contentType};base64,${image.toString('base64')}`;
      const url =
        `${this.config.azureOpenAiEndpoint!.replace(/\/$/, '')}` +
        `/openai/deployments/${encodeURIComponent(this.config.azureOpenAiDeployment)}` +
        `/chat/completions?api-version=${encodeURIComponent(this.config.azureOpenAiApiVersion)}`;

      const body = {
        messages: [
          {
            role: 'system',
            content:
              'You write a short, warm scrapbook caption (max 12 words) for a couple\'s shared photo. Return only the caption text.'
          },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Write the caption for this photo.' },
              { type: 'image_url', image_url: { url: dataUrl } }
            ]
          }
        ],
        max_tokens: 60,
        temperature: 0.7
      };

      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'api-key': this.config.azureOpenAiApiKey!
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        logger.warn({ status: res.status }, 'caption: AI call failed, using fallback');
        return { caption: FALLBACK_CAPTION, source: 'fallback' };
      }
      const json = (await res.json()) as {
        choices?: Array<{ message?: { content?: string } }>;
      };
      const text = json.choices?.[0]?.message?.content?.trim();
      if (!text) return { caption: FALLBACK_CAPTION, source: 'fallback' };
      return { caption: text.slice(0, 200), source: 'ai' };
    } catch (err) {
      logger.warn({ err: (err as Error).message }, 'caption: error, using fallback');
      return { caption: FALLBACK_CAPTION, source: 'fallback' };
    }
  }

  async ping(): Promise<{ available: boolean; message?: string }> {
    if (!isAzureOpenAiConfigured(this.config)) {
      return { available: false, message: 'Azure OpenAI not configured (using fallback captions)' };
    }
    return { available: true };
  }
}

export const FALLBACK_CAPTION_TEXT = FALLBACK_CAPTION;
