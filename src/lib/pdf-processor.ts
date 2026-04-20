import { PDFDocument } from 'pdf-lib';

export type CompressionLevel = 'basic' | 'balanced_50' | 'extreme';

export interface CompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
}

export async function compressPdf(
  file: File,
  level: CompressionLevel = 'balanced_50'
): Promise<CompressionResult> {
  const arrayBuffer = await file.arrayBuffer();
  
  // To truly maximize compression in pdf-lib (without WASM image re-encoding):
  // 1. Create a fresh document
  // 2. Copy over only the necessary pages (this strips unused resources)
  // 3. Save with object stream optimization
  
  const srcDoc = await PDFDocument.load(arrayBuffer);
  const pdfDoc = await PDFDocument.create();
  
  const pageIndices = srcDoc.getPageIndices();
  const copiedPages = await pdfDoc.copyPages(srcDoc, pageIndices);
  
  copiedPages.forEach((page) => {
    pdfDoc.addPage(page);
  });
  
  if (level === 'extreme' || level === 'balanced_50') {
    // Stripping metadata
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('PDF Compressor Pro');
    pdfDoc.setCreator('PDF Compressor Pro');
  }

  // Use the most aggressive save options available in pdf-lib
  const compressedBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false,
    // Note: pdf-lib doesn't support image re-compression directly, 
    // but copying pages already helps with removing dead objects.
  });

  const finalBytes = compressedBytes.length < arrayBuffer.byteLength ? compressedBytes : arrayBuffer;
  const blob = new Blob([finalBytes], { type: 'application/pdf' });
  
  return {
    blob,
    originalSize: file.size,
    compressedSize: blob.size,
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
