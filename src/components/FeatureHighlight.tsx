
import { motion } from "framer-motion";
import { Image } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface FeatureHighlightProps {
  title: string;
  description: string;
  buttonText: string;
  link: string;
  imageSrc?: string;
}

const FeatureHighlight = ({ 
  title, 
  description, 
  buttonText, 
  link, 
  imageSrc 
}: FeatureHighlightProps) => {
  const { user } = useAuth();
  
  return (
    <div className="glass-card rounded-xl overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 flex flex-col justify-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold mb-4">{title}</h3>
            <p className="text-gray-300 mb-6">{description}</p>
            <Link to={user ? link : "/auth"}>
              <Button className="flex items-center gap-2">
                <Image size={16} /> {buttonText}
              </Button>
            </Link>
          </motion.div>
        </div>

        <motion.div 
          className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 p-6 flex items-center justify-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          viewport={{ once: true }}
        >
          <div className="bg-black/20 p-4 rounded-xl border border-white/10 shadow-lg">
            {imageSrc ? (
              <img 
                src={imageSrc} 
                alt="Feature preview" 
                className="rounded shadow-lg max-w-full" 
              />
            ) : (
              <div className="w-full aspect-video flex items-center justify-center bg-black/40 rounded">
                <Image size={64} className="text-gray-600" />
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default FeatureHighlight;
