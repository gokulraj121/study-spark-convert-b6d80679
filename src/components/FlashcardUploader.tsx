
import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { FileText, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { motion } from "framer-motion";

interface FlashcardUploaderProps {
  onUpload: (file: File) => void;
  isUploading: boolean;
  isProcessing: boolean;
}

export const FlashcardUploader: React.FC<FlashcardUploaderProps> = ({
  onUpload,
  isUploading,
  isProcessing,
}) => {
  const [processingProgress, setProcessingProgress] = useState(0);

  React.useEffect(() => {
    if (isProcessing) {
      const interval = setInterval(() => {
        setProcessingProgress((prev) => {
          const newProgress = prev + Math.random() * 10;
          return newProgress >= 95 ? 95 : newProgress;
        });
      }, 500);

      return () => {
        clearInterval(interval);
        setProcessingProgress(0);
      };
    }
  }, [isProcessing]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      onUpload(acceptedFiles[0]);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
    },
    maxFiles: 1,
    disabled: isUploading || isProcessing,
  });

  return (
    <div className="glass-card p-8 rounded-xl">
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
          ${isDragActive ? "border-primary bg-primary/10" : "border-gray-700 hover:border-primary/50 hover:bg-gray-900/50"}
          ${isUploading || isProcessing ? "opacity-50 pointer-events-none" : ""}
        `}
      >
        <input {...getInputProps()} />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4"
        >
          <div className="bg-blue-500/20 text-blue-400 p-4 rounded-full">
            <FileText size={32} />
          </div>
          <div>
            <h3 className="text-xl font-medium">Upload PDF</h3>
            <p className="text-gray-400 mt-2">
              Drag & drop your PDF file here, or click to select
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Maximum file size: 10MB
            </p>
          </div>
          <Button className="mt-2 flex items-center gap-2">
            <Upload size={16} />
            Select PDF
          </Button>
        </motion.div>
      </div>

      {isProcessing && (
        <div className="mt-6">
          <div className="flex justify-between text-sm mb-2">
            <span>Generating flashcards...</span>
            <span>{Math.round(processingProgress)}%</span>
          </div>
          <Progress value={processingProgress} className="h-2" />
        </div>
      )}
    </div>
  );
};
