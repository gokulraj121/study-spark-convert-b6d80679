import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Upload, Download, FileType, FileArchive } from "lucide-react";
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
import { Slider } from "@/components/ui/slider";
import { detectFileFormat, getConversionOptions, formatFileSize } from "@/utils/fileUtils";

type ConversionType = 
  | "pdf-to-docx" 
  | "docx-to-pdf" 
  | "jpg-to-png" 
  | "png-to-jpg" 
  | "image-to-text" 
  | "pdf-to-text"
  | "image-compress"
  | "pdf-compress";

const ConverterPage = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [fileFormat, setFileFormat] = useState<string>('');
  const [conversionOptions, setConversionOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [conversionType, setConversionType] = useState<ConversionType | ''>('');
  const [isConverting, setIsConverting] = useState(false);
  const [convertedFileUrl, setConvertedFileUrl] = useState<string | null>(null);
  const [convertedText, setConvertedText] = useState<string | null>(null);
  const [compressionLevel, setCompressionLevel] = useState(70); // Default compression level
  const [originalSize, setOriginalSize] = useState<string>('');
  const [compressedSize, setCompressedSize] = useState<string>('');

  useEffect(() => {
    if (file) {
      const format = detectFileFormat(file.name);
      setFileFormat(format);
      
      const options = getConversionOptions(format);
      setConversionOptions(options);
      
      if (options.length > 0) {
        setConversionType(options[0].value as ConversionType);
      } else {
        setConversionType('');
        toast({
          variant: "destructive",
          title: "Unsupported file format",
          description: "This file format is not supported for conversion.",
        });
      }
      
      setOriginalSize(formatFileSize(file.size));
      setCompressedSize('');
    } else {
      setFileFormat('');
      setConversionOptions([]);
      setConversionType('');
      setOriginalSize('');
      setCompressedSize('');
    }
  }, [file, toast]);

  const handleUploadFile = (uploadedFile: File) => {
    setFile(uploadedFile);
    setConvertedFileUrl(null);
    setConvertedText(null);
  };

  const handleConvert = async () => {
    if (!file || !conversionType) {
      toast({
        variant: "destructive",
        title: "No file or conversion selected",
        description: "Please upload a file and select a conversion type.",
      });
      return;
    }

    setIsConverting(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("conversion_type", conversionType);
    
    if (conversionType === "image-compress" || conversionType === "pdf-compress") {
      formData.append("compression_level", compressionLevel.toString());
    }

    try {
      toast({
        title: "Processing File",
        description: isCompression() 
          ? "Compressing your file..." 
          : "Converting your file...",
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
        
        if (isCompression()) {
          setCompressedSize(formatFileSize(blob.size));
        }
      }

      toast({
        title: isCompression() ? "Compression Complete" : "Conversion Complete",
        description: isCompression() 
          ? "Your file has been successfully compressed." 
          : "Your file has been successfully converted.",
      });
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: isCompression()
          ? "Failed to compress the file. Please try again."
          : "Failed to convert the file. Please try again.",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const isCompression = () => {
    return conversionType === "image-compress" || conversionType === "pdf-compress";
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
          File Converter & Compressor
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-8"
        >
          <div className="glass-card p-6 rounded-xl">
            <FileUploader 
              onUpload={handleUploadFile} 
              acceptedTypes=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif,.bmp"
              selectedFile={file}
            />

            {file && conversionOptions.length > 0 && (
              <div className="mt-6">
                <Label htmlFor="conversion-type">Available Operations</Label>
                <Select 
                  value={conversionType}
                  onValueChange={(value) => {
                    setConversionType(value as ConversionType);
                    setConvertedFileUrl(null);
                    setConvertedText(null);
                    setCompressedSize('');
                  }}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select operation" />
                  </SelectTrigger>
                  <SelectContent>
                    {conversionOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {isCompression() && (
              <div className="mt-6">
                <Label htmlFor="compression-level" className="mb-2 block">
                  Compression Level: {compressionLevel}%
                </Label>
                <Slider
                  id="compression-level"
                  min={10}
                  max={100}
                  step={5}
                  value={[compressionLevel]}
                  onValueChange={(values) => setCompressionLevel(values[0])}
                  className="py-4"
                />
                <div className="flex justify-between text-sm text-gray-500">
                  <span>Higher Quality</span>
                  <span>Smaller Size</span>
                </div>
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <Button
                onClick={handleConvert}
                disabled={!file || !conversionType || isConverting}
                className="flex items-center gap-2"
              >
                {isConverting ? "Processing..." : isCompression() ? (
                  <>
                    <FileArchive size={16} />
                    Compress File
                  </>
                ) : (
                  <>
                    <FileType size={16} />
                    Convert File
                  </>
                )}
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
                  {isCompression() ? <FileArchive size={32} /> : <FileType size={32} />}
                </div>
                <h3 className="text-xl font-semibold">
                  {isCompression() ? "Compression Complete!" : "Conversion Complete!"}
                </h3>
                
                {isCompression() && (
                  <div className="bg-black/30 p-3 rounded-lg text-sm mb-2 w-full max-w-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <div>Original Size:</div>
                      <div className="text-right font-medium">{originalSize}</div>
                      <div>Compressed Size:</div>
                      <div className="text-right font-medium text-green-400">{compressedSize}</div>
                      {originalSize && compressedSize && (
                        <>
                          <div>Reduction:</div>
                          <div className="text-right font-medium text-green-400">
                            {Math.round((1 - (Number(compressedSize.split(' ')[0]) / Number(originalSize.split(' ')[0]))) * 100)}%
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                )}
                
                <a 
                  href={convertedFileUrl} 
                  download={`${file?.name.split('.')[0]}-${isCompression() ? 'compressed' : 'converted'}.${conversionType.split("-to-")[1] || file?.name.split('.').pop()}`}
                >
                  <Button className="flex items-center gap-2">
                    <Download size={16} />
                    Download {isCompression() ? "Compressed" : "Converted"} File
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
