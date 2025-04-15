
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FileText, FileUp, BookOpen, LightbulbIcon, Image, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardTitle } from "@/components/ui/card";

const Index = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center px-4 py-16 md:py-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center max-w-4xl"
        >
          <h1 className="text-5xl md:text-7xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-500 to-indigo-500 mb-4">
            Document Toolkit
          </h1>
          
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Transform your documents with AI-powered tools. Convert, edit, and enhance your files with ease.
          </p>

          <div className="flex flex-wrap gap-4 justify-center">
            <Link to={user ? "/converter" : "/auth"}>
              <Button size="lg" className="gap-2">
                Get Started <ChevronRight size={16} />
              </Button>
            </Link>
            <Link to="/subscription">
              <Button size="lg" variant="outline" className="gap-2">
                View Plans <ChevronRight size={16} />
              </Button>
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-black/30 px-4">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">Powerful Document Tools</h2>
          <p className="text-xl text-gray-400 text-center mb-12">Everything you need to work with documents in one place</p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<FileUp className="h-8 w-8 text-blue-400" />}
              title="File Converter"
              description="Convert between PDF, Word, Excel, PowerPoint, and images with perfect formatting."
            />
            <FeatureCard 
              icon={<Image className="h-8 w-8 text-purple-400" />}
              title="PDF to Infographic"
              description="Transform your PDFs into beautiful, shareable infographics with our AI technology."
            />
            <FeatureCard 
              icon={<FileText className="h-8 w-8 text-green-400" />}
              title="Flashcards"
              description="Turn your study materials into effective flashcards for better learning and retention."
            />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 px-4">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-xl text-gray-400 text-center mb-12">Simple process, powerful results</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <StepCard 
              number="01"
              title="Upload Your File"
              description="Drag & drop or select files from your device, Google Drive, or Dropbox"
            />
            <StepCard 
              number="02"
              title="Choose Conversion"
              description="Select your desired output format or tool from our wide range of options"
            />
            <StepCard 
              number="03"
              title="Download Results"
              description="Get your converted files instantly via download, email, or cloud storage"
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <div className="glass-card p-8 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10">
            <h2 className="text-3xl font-bold mb-4">Ready to transform your documents?</h2>
            <p className="text-xl text-gray-300 mb-8">Join thousands of users who save time with Document Toolkit</p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to={user ? "/converter" : "/auth"}>
                <Button size="lg" className="gap-2">
                  {user ? "Go to Tools" : "Sign Up Free"} <ChevronRight size={16} />
                </Button>
              </Link>
              <Link to="/subscription">
                <Button size="lg" variant="outline" className="gap-2">
                  View Pricing <ChevronRight size={16} />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="glass-card rounded-xl p-6 flex flex-col items-center text-center"
  >
    <div className="mb-4 p-3 bg-white/5 rounded-full">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </motion.div>
);

const StepCard = ({ number, title, description }) => (
  <div className="flex flex-col items-center text-center">
    <div className="text-4xl font-bold text-blue-400 mb-4">{number}</div>
    <h3 className="text-xl font-semibold mb-2">{title}</h3>
    <p className="text-gray-400">{description}</p>
  </div>
);

export default Index;
