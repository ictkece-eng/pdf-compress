import { PDFDocument, PDFName, PDFDict } from 'pdf-lib';

export type CompressionLevel = 'basic' | 'balanced_50' | 'ultra_max';

export interface CompressionResult {
  blob: Blob;
  originalSize: number;
  compressedSize: number;
  signatureDetected: boolean;
}

export async function compressPdf(
  file: File,
  level: CompressionLevel = 'ultra_max'
): Promise<CompressionResult> {
  const arrayBuffer = await file.arrayBuffer();
  
  // 1. Initial Load to detect signatures and capabilities
  const sourceDoc = await PDFDocument.load(arrayBuffer, { 
    ignoreEncryption: true,
    capNumbers: true 
  });

  // Check for Digital Signatures (AcroForm with Sig fields)
  let hasSignatures = false;
  try {
    const catalog = sourceDoc.catalog;
    if (catalog.has(PDFName.of('AcroForm'))) {
      const acroForm = catalog.get(PDFName.of('AcroForm'));
      if (acroForm instanceof PDFDict) {
        const fields = acroForm.get(PDFName.of('Fields'));
        if (fields) hasSignatures = true;
      }
    }
    if (!hasSignatures && (catalog.has(PDFName.of('Perms')) || catalog.has(PDFName.of('DSS')))) {
      hasSignatures = true;
    }

    if (!hasSignatures) {
      const pages = sourceDoc.getPages();
      for (const page of pages) {
        const annots = (page as any).node.get(PDFName.of('Annots'));
        if (annots) hasSignatures = true;
        if (hasSignatures) break;
      }
    }
  } catch (e) {}

  let pdfDoc: PDFDocument;

  // STRATEGY: Always try to optimize. 
  // For non-signed we REBUILD to deduplicate. For signed we OPTIMIZE in-place.
  if (!hasSignatures && level === 'ultra_max') {
    pdfDoc = await PDFDocument.create();
    const pageIndices = sourceDoc.getPageIndices();
    const copiedPages = await pdfDoc.copyPages(sourceDoc, pageIndices);
    copiedPages.forEach((page) => pdfDoc.addPage(page));
  } else {
    pdfDoc = sourceDoc;
  }
  
  if (level === 'ultra_max' || level === 'balanced_50') {
    pdfDoc.setTitle('');
    pdfDoc.setAuthor('');
    pdfDoc.setSubject('');
    pdfDoc.setKeywords([]);
    pdfDoc.setProducer('PDF Pekerja Keras Pro');
    pdfDoc.setCreator('PDF Pekerja Keras Pro');
    
    try {
      const catalog = pdfDoc.catalog;

      // 1. Aggressive Structural Pruning
      // We strip everything that isn't required for rendering
      const globalStrip = [
        'PieceInfo', 'Metadata', 'Thumbnails', 'SpiderInfo', 
        'Articles', 'PageLabels', 'AF', 'OutputIntents', 
        'OCProperties', 'ViewerPreferences', 'PageLayout', 'PageMode'
      ];

      // Only strip markers of logical structure if no signatures (signatures often rely on tagging)
      if (!hasSignatures) {
        globalStrip.push('StructTreeRoot', 'Outlines', 'Dests', 'Names', 'Perms');
      }

      globalStrip.forEach(key => {
        if (catalog.has(PDFName.of(key))) catalog.delete(PDFName.of(key));
      });

      // 2. Resource Scavenging per Page
      const pages = pdfDoc.getPages();
      pages.forEach(page => {
        try {
          const pageRef = (page as any).node;
          if (pageRef) {
            // Keys that are safe to remove from page objects
            const pageStrip = ['Thumb', 'PieceInfo', 'Metadata', 'StructParents'];
            
            // Only strip Annots (links/forms) if it's a standard document
            if (!hasSignatures) pageStrip.push('Annots', 'Properties');
              
            pageStrip.forEach(key => {
              if (pageRef.has(PDFName.of(key))) pageRef.delete(PDFName.of(key));
            });
          }
        } catch (e) {}
      });

    } catch (e) {
      console.warn('Advanced optimization failed:', e);
    }
  }

  // 3. Ultra-Dense Binary Serialization
  // useObjectStreams: Packs metadata into compressed streams (massive savings for complex docs)
  // useBinaryXref: Uses modern cross-reference streams instead of ASCII tables
  const compressedBytes = await pdfDoc.save({
    useObjectStreams: true,
    addDefaultPage: false,
    updateFieldAppearances: false, 
  });

  const finalBytes = compressedBytes.length < arrayBuffer.byteLength ? compressedBytes : arrayBuffer;
  const blob = new Blob([finalBytes], { type: 'application/pdf' });
  
  return {
    blob,
    originalSize: file.size,
    compressedSize: blob.size,
    signatureDetected: hasSignatures
  };
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}
