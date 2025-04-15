import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Upload, Download, FileType, FileArchive, FileLock, FileUnlock, ScanText, Merge, Split, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { FileUploader } from "@/components/FileUploader";
import { BatchFileUploader } from "@/components/BatchFileUploader";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { detectFileFormat, getConversionOptions, formatFileSize, getBatchProcessingOptions } from "@/utils/fileUtils";
import { Input } from "@/components/ui/input";

type ConversionType = 
  | "pdf-to-docx" 
  | "pdf-to-xlsx"
  | "pdf-to-pptx"
  | "pdf-to-jpg"
  | "docx-to-pdf" 
  | "xlsx-to-pdf"
  | "pptx-to-pdf"
  | "jpg-to-png"
  | "jpg-to-pdf"
  | "png-to-jpg"
  | "png-to-pdf"
  | "image-to-text" 
  | "pdf-to-text"
  | "image-compress"
  | "pdf-compress"
  | "pdf-protect"
  | "pdf-unlock"
  | "pdf-ocr"
  | "merge-pdfs"
  | "split-pdf"
  | "batch-compress"
  | "batch-compress-images"
  | "batch-convert-to-pdf";

const ConverterPage = () => {
  const { toast } = useToast();
  const [file, setFile] = useState<File | null>(null);
  const [fileFormat, setFileFormat] = useState<string>('');
  const [conversionOptions, setConversionOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [batchOptions, setBatchOptions] = useState<Array<{ value: string; label: string }>>([]);
  const [conversionType, setConversionType] = useState<ConversionType | ''>('');
  const [isConverting, setIsConverting] = useState(false);
  const [convertedFileUrl, setConvertedFileUrl] = useState<string | null>(null);
  const [convertedText, setConvertedText] = useState<string | null>(null);
  const [compressionLevel, setCompressionLevel] = useState(70); // Default compression level
  const [originalSize, setOriginalSize] = useState<string>('');
  const [compressedSize, setCompressedSize] = useState<string>('');
  const [activeTab, setActiveTab] = useState<string>("single");
  const [password, setPassword] = useState<string>("");
  const [batchFiles, setBatchFiles] = useState<File[]>([]);
  const [splitPages, setSplitPages] = useState<string>("1-3,4-10");

  useEffect(() => {
    if (file) {
      const format = detectFileFormat(file.name);
      setFileFormat(format);
      
      const options = getConversionOptions(format);
      setConversionOptions(options);
      
      const batchOpts = getBatchProcessingOptions(format);
      setBatchOptions(batchOpts);
      
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
      setBatchOptions([]);
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

  const handleBatchUpload = (files: File[]) => {
    setBatchFiles(files);
    setConvertedFileUrl(null);
    setConvertedText(null);
  };

  const isProtectionOperation = () => {
    return conversionType === "pdf-protect" || conversionType === "pdf-unlock";
  };

  const isOCROperation = () => {
    return conversionType === "pdf-ocr" || conversionType === "image-to-text";
  };

  const isSplitOperation = () => {
    return conversionType === "split-pdf";
  };

  const isCompression = () => {
    return conversionType === "image-compress" || conversionType === "pdf-compress" || conversionType === "batch-compress" || conversionType === "batch-compress-images";
  };

  const isBatchOperation = () => {
    return conversionType === "merge-pdfs" || conversionType === "batch-compress" || conversionType === "batch-compress-images" || conversionType === "batch-convert-to-pdf";
  };

  const getOperationIcon = () => {
    switch (conversionType) {
      case "pdf-protect":
      case "pdf-unlock":
        return <FileLock size={16} />;
      case "pdf-ocr":
      case "image-to-text":
        return <ScanText size={16} />;
      case "merge-pdfs":
        return <Merge size={16} />;
      case "split-pdf":
        return <Split size={16} />;
      case "image-compress":
      case "pdf-compress":
      case "batch-compress":
      case "batch-compress-images":
        return <FileArchive size={16} />;
      default:
        return <FileType size={16} />;
    }
  };

  const getOperationButtonText = () => {
    if (isProtectionOperation()) {
      return conversionType === "pdf-protect" ? "Protect PDF" : "Unlock PDF";
    }
    if (isOCROperation()) {
      return "Extract Text";
    }
    if (conversionType === "merge-pdfs") {
      return "Merge PDFs";
    }
    if (conversionType === "split-pdf") {
      return "Split PDF";
    }
    if (isCompression()) {
      return "Compress";
    }
    return "Convert";
  };

  const handleConvert = async () => {
    if (isBatchOperation() && (!batchFiles || batchFiles.length === 0)) {
      toast({
        variant: "destructive",
        title: "No files selected",
        description: "Please upload files for batch processing.",
      });
      return;
    }
    
    if (!isBatchOperation() && (!file || !conversionType)) {
      toast({
        variant: "destructive",
        title: "No file or conversion selected",
        description: "Please upload a file and select a conversion type.",
      });
      return;
    }

    setIsConverting(true);

    const formData = new FormData();
    
    if (isBatchOperation()) {
      // For batch operations
      batchFiles.forEach((file) => {
        formData.append("files", file);
      });
    } else {
      // For single file operations
      formData.append("file", file as File);
    }
    
    formData.append("conversion_type", conversionType);
    
    if (isCompression()) {
      formData.append("compression_level", compressionLevel.toString());
    }
    
    if (isProtectionOperation()) {
      formData.append("password", password);
    }
    
    if (isSplitOperation()) {
      formData.append("split_ranges", splitPages);
    }

    try {
      toast({
        title: "Processing File",
        description: isCompression() 
          ? "Compressing your file..." 
          : isOCROperation()
          ? "Extracting text..."
          : isProtectionOperation()
          ? "Processing security settings..."
          : "Converting your file...",
      });

      // Note: This is a mock API call for frontend visualization
      // In a real implementation, you would need to enhance the backend to support these operations
      const response = await fetch("http://localhost:8000/api/convert", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      if (isOCROperation()) {
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
        title: getToastTitle(),
        description: getToastDescription(),
      });
    } catch (error) {
      console.error("Error processing file:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process the file. Please try again.",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const getToastTitle = () => {
    if (isCompression()) return "Compression Complete";
    if (isOCROperation()) return "Text Extraction Complete";
    if (isProtectionOperation()) return conversionType === "pdf-protect" ? "PDF Protected" : "PDF Unlocked";
    if (conversionType === "merge-pdfs") return "PDFs Merged";
    if (conversionType === "split-pdf") return "PDF Split Complete";
    return "Conversion Complete";
  };
  
  const getToastDescription = () => {
    if (isCompression()) return "Your file has been successfully compressed.";
    if (isOCROperation()) return "Text has been successfully extracted.";
    if (isProtectionOperation()) return conversionType === "pdf-protect" ? "Your PDF has been protected with a password." : "Your PDF has been unlocked.";
    if (conversionType === "merge-pdfs") return "Your PDFs have been merged into one document.";
    if (conversionType === "split-pdf") return "Your PDF has been split into multiple files.";
    return "Your file has been successfully converted.";
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
          File Converter & Tools
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="space-y-8"
        >
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-2 w-[400px] mx-auto">
              <TabsTrigger value="single">Single File</TabsTrigger>
              <TabsTrigger value="batch">Batch Processing</TabsTrigger>
            </TabsList>
            
            <TabsContent value="single" className="mt-6">
              <div className="glass-card p-6 rounded-xl">
                <FileUploader 
                  onUpload={handleUploadFile} 
                  acceptedTypes=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.bmp"
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
                        setPassword('');
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

                {isProtectionOperation() && (
                  <div className="mt-6">
                    <Label htmlFor="password" className="mb-2 block">
                      {conversionType === "pdf-protect" ? "Set Password" : "Enter Password"}
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={conversionType === "pdf-protect" ? "New password" : "Current password"}
                      className="w-full"
                    />
                  </div>
                )}

                {isSplitOperation() && (
                  <div className="mt-6">
                    <Label htmlFor="split-pages" className="mb-2 block">
                      Split Pages (e.g., "1-3,4-10" or "1,3,5-7")
                    </Label>
                    <Input
                      id="split-pages"
                      value={splitPages}
                      onChange={(e) => setSplitPages(e.target.value)}
                      placeholder="1-3,4-10"
                      className="w-full"
                    />
                  </div>
                )}
              </div>
            </TabsContent>
            
            <TabsContent value="batch" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle>Batch Processing</CardTitle>
                  <CardDescription>Upload multiple files for batch operations</CardDescription>
                </CardHeader>
                <CardContent>
                  <BatchFileUploader 
                    onUpload={handleBatchUpload} 
                    acceptedTypes=".pdf,.jpg,.jpeg,.png"
                    selectedFiles={batchFiles}
                  />
                  
                  {batchFiles.length > 0 && (
                    <div className="mt-6">
                      <Label htmlFor="batch-operation-type">Available Batch Operations</Label>
                      <Select 
                        value={conversionType}
                        onValueChange={(value) => {
                          setConversionType(value as ConversionType);
                          setConvertedFileUrl(null);
                        }}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select operation" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="merge-pdfs">Merge PDFs</SelectItem>
                          <SelectItem value="batch-compress">Compress Multiple PDFs</SelectItem>
                          <SelectItem value="batch-compress-images">Compress Multiple Images</SelectItem>
                          <SelectItem value="batch-convert-to-pdf">Convert Multiple to PDF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                  
                  {isCompression() && (
                    <div className="mt-6">
                      <Label htmlFor="batch-compression-level" className="mb-2 block">
                        Compression Level: {compressionLevel}%
                      </Label>
                      <Slider
                        id="batch-compression-level"
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
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="flex justify-center">
            <Button
              onClick={handleConvert}
              disabled={(activeTab === "single" && (!file || !conversionType)) || 
                       (activeTab === "batch" && (batchFiles.length === 0 || !conversionType)) || 
                       isConverting}
              className="flex items-center gap-2"
            >
              {isConverting ? "Processing..." : (
                <>
                  {getOperationIcon()}
                  {getOperationButtonText()}
                </>
              )}
            </Button>
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
                  {getToastTitle()}
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
                  download={`${file?.name.split('.')[0] || 'converted'}-${isCompression() ? 'compressed' : 'converted'}.${conversionType.split("-to-")[1] || file?.name.split('.').pop()}`}
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
