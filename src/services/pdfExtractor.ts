import * as pdfjsLib from 'pdfjs-dist';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Configure local worker via Vite URL
if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
}

export interface PdfExtractionResult {
  text: string;
  pageCount: number;
  isScannedPdf: boolean;
  characterCount: number;
}

/**
 * Extracts embedded text from a PDF document in the browser.
 * Detects whether the PDF is a scanned image without an embedded text layer.
 */
export async function extractTextFromPdf(
  file: File,
  onProgress?: (percent: number, status: string) => void
): Promise<PdfExtractionResult> {
  onProgress?.(10, 'Loading PDF document into memory...');

  const arrayBuffer = await file.arrayBuffer();

  const loadingTask = pdfjsLib.getDocument({
    data: new Uint8Array(arrayBuffer),
    useSystemFonts: true,
  });

  const pdf = await loadingTask.promise;
  const pageCount = pdf.numPages;
  const pageTexts: string[] = [];

  for (let pageNum = 1; pageNum <= pageCount; pageNum++) {
    const progressPercent = Math.min(90, Math.round(10 + (pageNum / pageCount) * 75));
    onProgress?.(progressPercent, `Extracting text from page ${pageNum} of ${pageCount}...`);

    const page = await pdf.getPage(pageNum);
    const textContent = await page.getTextContent();

    // Group items into text lines
    const textItems = textContent.items
      .map((item) => {
        if ('str' in item && typeof item.str === 'string') {
          return item.str;
        }
        return '';
      })
      .filter(Boolean);

    // Join with space or newline
    const pageString = textItems.join(' ');
    pageTexts.push(pageString);
  }

  onProgress?.(95, 'Synthesizing document text layer...');

  const fullText = pageTexts.join('\n\n');
  const nonWhitespaceCount = fullText.replace(/\s+/g, '').length;

  // If a multi-page or single-page PDF has virtually no embedded text, it's a scanned document
  const isScannedPdf = nonWhitespaceCount < 30;

  return {
    text: fullText,
    pageCount,
    isScannedPdf,
    characterCount: nonWhitespaceCount,
  };
}
