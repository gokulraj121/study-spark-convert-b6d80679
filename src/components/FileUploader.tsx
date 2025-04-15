
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface FileUploaderProps {
  onUpload: (file: File) => void;
  acceptedTypes?: string;
  maxSize?: number;
  selectedFile: File | null;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onUpload,
  acceptedTypes,
  maxSize = 10 * 1024 * 1024, // 10MB default
  selectedFile,
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes ? { 
      [acceptedTypes.includes('image') ? 'image/*' : acceptedTypes.includes('.doc') ? 'application/msword' : 'application/pdf']: acceptedTypes.split(',') 
    } : undefined,
    maxSize,
    maxFiles: 1,
  });

  const handleRemoveFile = (e: React.MouseEvent) => {
    e.stopPropagation();
    onUpload(null as unknown as File);
  };

  return (
    <div>
      {!selectedFile ? (
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
            ${isDragActive ? "border-primary bg-primary/10" : "border-gray-700 hover:border-primary/50 hover:bg-gray-900/50"}
          `}
        >
          <input {...getInputProps()} />
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center gap-3"
          >
            <div className="bg-blue-500/20 text-blue-400 p-3 rounded-full">
              <FileText size={24} />
            </div>
            <div>
              <p className="text-sm text-gray-300">
                Drag & drop your file here, or click to select
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {acceptedTypes ? `Accepted formats: ${acceptedTypes}` : "All file types accepted"}
              </p>
            </div>
          </motion.div>
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border rounded-lg p-4 flex items-center justify-between glass-card"
        >
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/20 text-blue-400 p-2 rounded-full">
              <FileText size={20} />
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{selectedFile.name}</p>
              <p className="text-xs text-gray-400">
                {(selectedFile.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full h-8 w-8"
            onClick={handleRemoveFile}
          >
            <X size={16} />
          </Button>
        </motion.div>
      )}
    </div>
  );
};
