import Tesseract from 'tesseract.js';

export interface OcrExtractionResult {
  text: string;
  confidence: number;
  characterCount: number;
  isUnreadable: boolean;
}

/**
 * Executes browser-side OCR on PNG or JPG laboratory test photos using Tesseract.js.
 * Reports real-time recognition progress and cleans up object URLs.
 */
export async function extractTextFromImage(
  file: File,
  onProgress?: (percent: number, status: string) => void
): Promise<OcrExtractionResult> {
  const objectUrl = URL.createObjectURL(file);

  try {
    onProgress?.(10, 'Initializing OCR optical recognition engine...');

    const result = await Tesseract.recognize(objectUrl, 'eng', {
      logger: (message) => {
        if (message.status === 'recognizing text' && typeof message.progress === 'number') {
          const percent = Math.min(95, Math.round(15 + message.progress * 80));
          onProgress?.(percent, `Recognizing characters (${percent}%)...`);
        } else if (message.status === 'loading tesseract core') {
          onProgress?.(15, 'Loading optical character engine...');
        } else if (message.status === 'initializing tesseract') {
          onProgress?.(25, 'Calibrating character recognition...');
        }
      },
    });

    onProgress?.(98, 'Analyzing recognized text structure...');

    const fullText = result.data.text || '';
    const nonWhitespaceCount = fullText.replace(/\s+/g, '').length;
    const confidence = result.data.confidence || 0;

    // An image is unreadable if virtually no characters were resolved or confidence is near zero
    const isUnreadable = nonWhitespaceCount < 15 || (confidence < 25 && nonWhitespaceCount < 30);

    return {
      text: fullText,
      confidence,
      characterCount: nonWhitespaceCount,
      isUnreadable,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}
