
import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, X, Upload, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatFileSize } from "@/utils/fileUtils";

interface BatchFileUploaderProps {
  onUpload: (files: File[]) => void;
  acceptedTypes?: string;
  maxSize?: number;
  selectedFiles: File[];
}

export const BatchFileUploader: React.FC<BatchFileUploaderProps> = ({
  onUpload,
  acceptedTypes,
  maxSize = 50 * 1024 * 1024, // 50MB default
  selectedFiles,
}) => {
  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload([...selectedFiles, ...acceptedFiles]);
    }
  }, [onUpload, selectedFiles]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedTypes ? { 
      [acceptedTypes.includes('image') ? 'image/*' : acceptedTypes.includes('.doc') ? 'application/msword' : 'application/pdf']: acceptedTypes.split(',') 
    } : undefined,
    maxSize,
  });

  const handleRemoveFile = (indexToRemove: number) => {
    const newFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
    onUpload(newFiles);
  };

  const totalSize = selectedFiles.reduce((acc, file) => acc + file.size, 0);

  return (
    <div className="space-y-4">
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
            <Plus size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-300">
              {selectedFiles.length > 0 
                ? "Add more files" 
                : "Drag & drop multiple files here, or click to select"}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {acceptedTypes ? `Accepted formats: ${acceptedTypes}` : "All file types accepted"}
            </p>
          </div>
          
          <Button variant="secondary" size="sm" className="mt-2 flex items-center gap-2">
            <Upload size={16} />
            Select Files
          </Button>
        </motion.div>
      </div>

      {selectedFiles.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="border rounded-lg p-4 glass-card"
        >
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-sm font-medium">{selectedFiles.length} Files Selected ({formatFileSize(totalSize)})</h3>
            <Button 
              variant="destructive" 
              size="sm"
              onClick={() => onUpload([])}
            >
              Clear All
            </Button>
          </div>
          
          <ScrollArea className="h-[200px] rounded-md border p-2">
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={`${file.name}-${index}`} className="flex items-center justify-between bg-black/20 p-2 rounded">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText size={16} className="text-blue-400 shrink-0" />
                    <span className="text-sm truncate">{file.name}</span>
                    <span className="text-xs text-gray-400">({formatFileSize(file.size)})</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 rounded-full"
                    onClick={() => handleRemoveFile(index)}
                  >
                    <X size={12} />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </motion.div>
      )}
    </div>
  );
};
