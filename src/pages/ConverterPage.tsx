
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Upload, Download, FileType } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { FileUploader } from "@/components/FileUploader";
import { motion } from "framer-motion";
import { 
  Select, 
  SelectTrigger, 
  SelectValue, 
  SelectContent, 
  SelectItem
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

type ConversionType = 
  | "pdf-to-docx" 
  | "docx-to-pdf" 
  | "jpg-to-png" 
  | "png-to-jpg" 
  | "image-to-text" 
  | "pdf-to-text";

const ConverterPage = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [conversionType, setConversionType] = useState<ConversionType>("pdf-to-docx");
  const [isConverting, setIsConverting] = useState(false);
  const [convertedFileUrl, setConvertedFileUrl] = useState<string | null>(null);
  const [convertedText, setConvertedText] = useState<string | null>(null);

  const handleUploadFile = (uploadedFile: File) => {
    setFile(uploadedFile);
    setConvertedFileUrl(null);
    setConvertedText(null);
  };

  const handleConvert = async () => {
    if (!file) {
      toast({
        variant: "destructive",
        title: "No file selected",
        description: "Please upload a file first.",
      });
      return;
    }

    setIsConverting(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversion_type", conversionType);

    try {
      toast({
        title: "Converting File",
        description: "Please wait while we process your file...",
      });

      const response = await fetch("http://localhost:8000/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      if (conversionType === "image-to-text" || conversionType === "pdf-to-text") {
        const data = await response.json();
        setConvertedText(data.text);
      } else {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setConvertedFileUrl(url);
      }

      toast({
        title: "Conversion Complete",
        description: "Your file has been successfully converted.",
      });
    } catch (error) {
      console.error("Error converting file:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to convert the file. Please try again.",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const getFileExtension = (filename: string) => {
    return filename.split('.').pop()?.toLowerCase();
  };

  const isValidFileForConversion = () => {
    if (!file) return false;
    
    const extension = getFileExtension(file.name);
    switch(conversionType) {
      case "pdf-to-docx":
        return extension === "pdf";
      case "docx-to-pdf":
        return extension === "docx" || extension === "doc";
      case "jpg-to-png":
        return extension === "jpg" || extension === "jpeg";
      case "png-to-jpg":
        return extension === "png";
      case "image-to-text":
        return ["jpg", "jpeg", "png", "gif", "bmp"].includes(extension || "");
      case "pdf-to-text":
        return extension === "pdf";
      default:
        return false;
    }
  };

  const getFileTypeLabel = (type: ConversionType) => {
    switch(type) {
      case "pdf-to-docx": return "PDF to Word";
      case "docx-to-pdf": return "Word to PDF";
      case "jpg-to-png": return "JPG to PNG";
      case "png-to-jpg": return "PNG to JPG";
      case "image-to-text": return "Image to Text (OCR)";
      case "pdf-to-text": return "PDF to Text";
    }
  };

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-8"
        >
          <Link to="/">
            <Button variant="ghost" size="sm" className="flex items-center gap-2">
              <ArrowLeft size={16} />
              <span>Back to Home</span>
            </Button>
          </Link>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl font-bold text-center mb-8"
        >
          File Converter
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-8"
        >
          <div className="glass-card p-6 rounded-xl">
            <div className="mb-6">
              <Label htmlFor="conversion-type">Conversion Type</Label>
              <Select 
                value={conversionType}
                onValueChange={(value) => {
                  setConversionType(value as ConversionType);
                  setFile(null);
                  setConvertedFileUrl(null);
                  setConvertedText(null);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select conversion type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf-to-docx">PDF to Word</SelectItem>
                  <SelectItem value="docx-to-pdf">Word to PDF</SelectItem>
                  <SelectItem value="jpg-to-png">JPG to PNG</SelectItem>
                  <SelectItem value="png-to-jpg">PNG to JPG</SelectItem>
                  <SelectItem value="image-to-text">Image to Text (OCR)</SelectItem>
                  <SelectItem value="pdf-to-text">PDF to Text</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <FileUploader 
              onUpload={handleUploadFile} 
              acceptedTypes={
                conversionType === "pdf-to-docx" || conversionType === "pdf-to-text" 
                  ? ".pdf" 
                  : conversionType === "docx-to-pdf" 
                  ? ".doc,.docx" 
                  : conversionType === "jpg-to-png" 
                  ? ".jpg,.jpeg" 
                  : conversionType === "png-to-jpg" 
                  ? ".png" 
                  : conversionType === "image-to-text" 
                  ? ".jpg,.jpeg,.png,.gif,.bmp" 
                  : undefined
              }
              selectedFile={file}
            />

            <div className="mt-6 flex justify-center">
              <Button
                onClick={handleConvert}
                disabled={!isValidFileForConversion() || isConverting}
                className="flex items-center gap-2"
              >
                {isConverting ? "Converting..." : "Convert File"}
              </Button>
            </div>
          </div>

          {convertedFileUrl && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="glass-card p-6 rounded-xl text-center"
            >
              <div className="flex flex-col items-center gap-4">
                <div className="flex items-center justify-center rounded-full w-16 h-16 bg-green-500/20 text-green-400">
                  <FileType size={32} />
                </div>
                <h3 className="text-xl font-semibold">Conversion Complete!</h3>
                <a 
                  href={convertedFileUrl} 
                  download={`converted-file.${conversionType.split("-to-")[1]}`}
                >
                  <Button className="flex items-center gap-2">
                    <Download size={16} />
                    Download Converted File
                  </Button>
                </a>
              </div>
            </motion.div>
          )}

          {convertedText && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.3 }}
              className="glass-card p-6 rounded-xl"
            >
              <h3 className="text-xl font-semibold mb-4">Extracted Text</h3>
              <div className="bg-black/30 p-4 rounded-lg max-h-96 overflow-y-auto">
                <pre className="text-sm whitespace-pre-wrap">{convertedText}</pre>
              </div>
              <div className="mt-4 flex justify-end">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    const blob = new Blob([convertedText], { type: "text/plain" });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = "extracted-text.txt";
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-2"
                >
                  <Download size={16} />
                  Download as Text File
                </Button>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default ConverterPage;
