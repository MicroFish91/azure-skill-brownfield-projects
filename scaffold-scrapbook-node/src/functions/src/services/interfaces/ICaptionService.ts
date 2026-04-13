export interface ICaptionService {
  generateCaption(imageBuffer: Buffer): Promise<string>;
  healthCheck(): Promise<boolean>;
}
