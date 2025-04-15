
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FileText, FileUp } from "lucide-react";
import { Button } from "@/components/ui/button";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl"
      >
        <h1 className="text-5xl md:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-purple-500 mb-4">
          Smart Study Tool
        </h1>
        
        <p className="text-xl text-gray-300 mb-12">
          Convert files easily or turn your notes into flashcards using AI
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-xl mx-auto">
          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link to="/flashcard">
              <Button
                variant="outline"
                size="lg"
                className="w-full h-32 glass-card bg-gradient-to-br from-blue-500/10 to-blue-700/10 hover:glow border-blue-500/20 flex flex-col items-center justify-center gap-3"
              >
                <FileText size={32} className="text-blue-400" />
                <span className="text-xl">Flashcard Generator</span>
              </Button>
            </Link>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
          >
            <Link to="/converter">
              <Button
                variant="outline"
                size="lg"
                className="w-full h-32 glass-card bg-gradient-to-br from-purple-500/10 to-purple-700/10 hover:glow border-purple-500/20 flex flex-col items-center justify-center gap-3"
              >
                <FileUp size={32} className="text-purple-400" />
                <span className="text-xl">File Converter</span>
              </Button>
            </Link>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};

export default Index;
