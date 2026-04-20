import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';

export type CompressionLevel = 'basic' | 'balanced_50' | 'ultra_max';

export interface CompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
}

export async function compressPdf(
  file: File,
  level: CompressionLevel = 'ultra_max'
): Promise<CompressionResult> {
  const arrayBuffer = await file.arrayBuffer();
  
  // IMPORTANT: To maintain visual and digital signature integrity (TTD Digital),
  // we optimize the existing document structure without re-encoding images or pages.
  
  const pdfDoc = await PDFDocument.load(arrayBuffer, { 
    ignoreEncryption: true,
    capNumbers: true 
  });
  
  if (level === 'ultra_max' || level === 'balanced_50') {
    // Standard metadata stripping
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('PDF Compressor Pro');
    pdfDoc.setCreator('PDF Compressor Pro');
    
    try {
      const catalog = pdfDoc.catalog;

      // 1. Strip XMP Metadata
      if (catalog.has(PDFName.of('Metadata'))) {
        catalog.delete(PDFName.of('Metadata'));
      }

      // 2. Deep Structural Stripping (Private data & secondary features)
      const stripKeys = [
        'PieceInfo',      // Private app data (Illustrator/Photoshop)
        'StructTreeRoot', // Accessibility tags (huge savings)
        'Outlines',       // Bookmarks
        'Dests',          // Named destinations
        'PageLabels',     // Custom page numbering
        'Thumbnails',     // Page thumbnails
        'Articles',       // Article threads
        'SpiderInfo',     // Web capture data
        'ViewerPreferences',
        'PageLayout',
        'PageMode'
      ];

      stripKeys.forEach(key => {
        if (catalog.has(PDFName.of(key))) {
          catalog.delete(PDFName.of(key));
        }
      });

      // 3. Names Dictionary Cleanup
      if (catalog.has(PDFName.of('Names'))) {
        const names = catalog.get(PDFName.of('Names'));
        if (names instanceof PDFDict) {
          ['Dests', 'EmbeddedFiles', 'JavaScript', 'Pages', 'Templates'].forEach(key => {
            if (names.has(PDFName.of(key))) names.delete(PDFName.of(key));
          });
        }
      }

      // 4. Per-Page Deep Clean
      const pages = pdfDoc.getPages();
      pages.forEach(page => {
        try {
          const pageRef = (page as any).node;
          if (pageRef) {
            ['Thumb', 'PieceInfo', 'Metadata', 'StructParents', 'Properties'].forEach(key => {
              if (pageRef.has(PDFName.of(key))) pageRef.delete(PDFName.of(key));
            });
          }
        } catch (e) {}
      });

    } catch (e) {
      console.warn('Ultra compression stripping failed:', e);
    }
  }

  // Use the most effective compression-safe save options
  const compressedBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false, // Essential for preserving TTD Visual appearance
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
