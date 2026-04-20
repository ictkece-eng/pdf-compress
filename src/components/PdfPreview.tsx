import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';

// Use unpkg CDN which is usually more reliable for specific versions
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

interface PdfPreviewProps {
  file: File | Blob;
}

export const PdfPreview: React.FC<PdfPreviewProps> = ({ file }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    const renderPreview = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument({ 
          data: arrayBuffer,
          // Add standard font data for better compatibility
          standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/standard_fonts/`,
        });
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        
        if (!active) return;

        const viewport = page.getViewport({ scale: 1 });
        const canvas = canvasRef.current;
        if (!canvas) return;

        const context = canvas.getContext('2d');
        if (!context) return;

        // Calculate scale to fit width while maintaining aspect ratio
        // Added fallback for container width if element is not yet sized
        const containerWidth = containerRef.current?.clientWidth || 300;
        const scale = Math.max(containerWidth / viewport.width, 0.5);
        const scaledViewport = page.getViewport({ scale });

        canvas.height = scaledViewport.height;
        canvas.width = scaledViewport.width;

        const renderContext = {
          canvasContext: context,
          viewport: scaledViewport,
        } as any;

        await page.render(renderContext).promise;
        if (active) setLoading(false);
      } catch (err) {
        console.error('Error rendering PDF:', err);
        if (active) setError('Gagal memuat pratinjau. Format file mungkin tidak didukung.');
        if (active) setLoading(false);
      }
    };

    // Small delay to ensure container is measured correctly if inside entrance animation
    const timeout = setTimeout(renderPreview, 100);

    return () => {
      active = false;
      clearTimeout(timeout);
    };
  }, [file]);

  return (
    <div ref={containerRef} className="relative w-full aspect-[1/1.4] bg-muted rounded-lg overflow-hidden border border-border flex items-center justify-center">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50 backdrop-blur-sm z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-medium text-muted-foreground">Menyiapkan pratinjau...</p>
          </div>
        </div>
      )}
      
      {error ? (
        <div className="p-4 text-center">
          <p className="text-sm text-destructive">{error}</p>
        </div>
      ) : (
        <canvas ref={canvasRef} className="max-w-full h-auto shadow-sm" />
      )}
    </div>
  );
};
