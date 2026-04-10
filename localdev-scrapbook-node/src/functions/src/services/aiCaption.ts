import OpenAI from 'openai';
import { IAICaptionService } from './interfaces/IAICaptionService';

export class AzureOpenAICaptionService implements IAICaptionService {
  private client: OpenAI;
  private deployment: string;

  constructor(endpoint: string, apiKey: string, deployment: string) {
    this.deployment = deployment;
    this.client = new OpenAI({
      apiKey,
      baseURL: `${endpoint}/openai/deployments/${deployment}`,
      defaultQuery: { 'api-version': '2024-04-01-preview' },
      defaultHeaders: { 'api-key': apiKey },
    });
  }

  async generateCaption(imageBuffer: Buffer, mimeType: string): Promise<string> {
    const base64Image = imageBuffer.toString('base64');
    const dataUri = `data:${mimeType};base64,${base64Image}`;

    const response = await this.client.chat.completions.create({
      model: this.deployment,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Write a short, sweet, and romantic caption for this couple photo. Keep it under 100 characters.',
            },
            {
              type: 'image_url',
              image_url: { url: dataUri },
            },
          ],
        },
      ],
      max_tokens: 100,
    });

    return response.choices[0]?.message?.content?.trim() || 'A beautiful moment together 💕';
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.client.models.list();
      return true;
    } catch {
      return false;
    }
  }
}
