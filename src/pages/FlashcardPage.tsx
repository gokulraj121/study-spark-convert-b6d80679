
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Upload, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { FlashcardUploader } from "@/components/FlashcardUploader";
import { FlashcardDisplay } from "@/components/FlashcardDisplay";
import { motion } from "framer-motion";

export interface Flashcard {
  question: string;
  answer: string;
}

const FlashcardPage = () => {
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleUploadPDF = async (file: File) => {
    setIsUploading(true);
    setIsProcessing(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      toast({
        title: "Processing PDF",
        description: "Extracting text and generating flashcards...",
      });

      const response = await fetch("http://localhost:8000/api/flashcards", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Error: ${response.status}`);
      }

      const data = await response.json();
      setFlashcards(data.flashcards);
      
      toast({
        title: "Success!",
        description: `Generated ${data.flashcards.length} flashcards from your PDF.`,
      });
    } catch (error) {
      console.error("Error processing PDF:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process the PDF. Please try again.",
      });
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
    }
  };

  const downloadFlashcards = () => {
    if (flashcards.length === 0) return;

    let content = "";
    flashcards.forEach((card, index) => {
      content += `Q: ${card.question}\nA: ${card.answer}\n\n`;
    });

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "flashcards.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Download Complete",
      description: "Flashcards have been downloaded as a text file.",
    });
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
          Flashcard Generator
        </motion.h1>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {flashcards.length === 0 ? (
            <FlashcardUploader 
              onUpload={handleUploadPDF} 
              isUploading={isUploading}
              isProcessing={isProcessing}
            />
          ) : (
            <div className="space-y-6">
              <div className="flex justify-end">
                <Button 
                  onClick={downloadFlashcards} 
                  className="flex items-center gap-2"
                >
                  <Download size={16} />
                  Download Flashcards
                </Button>
              </div>
              <FlashcardDisplay flashcards={flashcards} />
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default FlashcardPage;
