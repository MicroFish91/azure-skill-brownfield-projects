export interface CaptionResult {
  caption: string;
  source: 'ai' | 'fallback';
}

/**
 * Caption generator. Enhancement service: implementations MUST NOT throw
 * on missing config from the constructor; they should return a fallback
 * caption from generate().
 */
export interface ICaptionService {
  generate(image: Buffer, contentType: string): Promise<CaptionResult>;
  ping(): Promise<{ available: boolean; message?: string }>;
}
