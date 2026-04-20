import React from 'react';
import { useDropzone, DropzoneOptions } from 'react-dropzone';
import { FileUp, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  isProcessing: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, isProcessing }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        onFileSelect(acceptedFiles[0]);
      }
    },
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: false,
    disabled: isProcessing,
  } as any);

  return (
    <div
      {...getRootProps()}
      className={cn(
        "relative group cursor-pointer overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 ease-in-out",
        "h-64 flex flex-col items-center justify-center gap-4",
        isDragActive 
          ? "border-primary bg-primary/5 scale-[1.01]" 
          : "border-muted-foreground/20 hover:border-primary/50 hover:bg-muted/50",
        isProcessing && "opacity-50 cursor-not-allowed"
      )}
    >
      <input {...getInputProps()} />
      
      <div className={cn(
        "p-4 rounded-full bg-primary/10 text-primary transition-transform duration-300",
        isDragActive ? "scale-110" : "group-hover:scale-110"
      )}>
        <FileUp className="w-8 h-8" />
      </div>

      <div className="text-center px-6">
        <p className="text-lg font-medium text-foreground">
          {isDragActive ? "Lepaskan file di sini" : "Klik atau seret file PDF ke sini"}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          Hanya file .pdf (Max 50MB)
        </p>
      </div>

      {/* Decorative background element */}
      <div className="absolute -bottom-6 -right-6 opacity-[0.03] group-hover:opacity-[0.05] transition-opacity">
        <Upload className="w-32 h-32 rotate-12" />
      </div>
    </div>
  );
};
