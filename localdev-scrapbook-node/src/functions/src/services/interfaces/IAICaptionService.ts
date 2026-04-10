export interface IAICaptionService {
  generateCaption(imageBuffer: Buffer, mimeType: string): Promise<string>;
  healthCheck(): Promise<boolean>;
}
