
import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Flashcard } from "@/pages/FlashcardPage";

interface FlashcardDisplayProps {
  flashcards: Flashcard[];
}

export const FlashcardDisplay: React.FC<FlashcardDisplayProps> = ({
  flashcards,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [direction, setDirection] = useState(0);

  const handleNext = () => {
    if (currentIndex < flashcards.length - 1) {
      setDirection(1);
      setShowAnswer(false);
      setTimeout(() => {
        setCurrentIndex(currentIndex + 1);
      }, 200);
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setShowAnswer(false);
      setTimeout(() => {
        setCurrentIndex(currentIndex - 1);
      }, 200);
    }
  };

  const handleFlip = () => {
    setShowAnswer(!showAnswer);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction < 0 ? 100 : -100,
      opacity: 0,
    }),
  };

  return (
    <div className="glass-card p-6 rounded-xl">
      <div className="text-sm text-gray-400 text-center mb-4">
        Card {currentIndex + 1} of {flashcards.length}
      </div>

      <div className="relative h-60 md:h-72">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={currentIndex}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.2 }}
            className="absolute w-full h-full"
          >
            <Card 
              className={`w-full h-full flex flex-col justify-center p-6 transition-all cursor-pointer
                ${showAnswer 
                  ? "bg-gradient-to-br from-blue-900/30 to-blue-700/20 border-blue-500/30" 
                  : "bg-gradient-to-br from-purple-900/30 to-purple-700/20 border-purple-500/30"}
              `}
              onClick={handleFlip}
            >
              <div className="absolute top-3 left-3 text-xs text-gray-400">
                {showAnswer ? "Answer" : "Question"}
              </div>
              <div className="text-center">
                <motion.p
                  key={`${currentIndex}-${showAnswer ? "answer" : "question"}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="text-lg md:text-xl"
                >
                  {showAnswer
                    ? flashcards[currentIndex].answer
                    : flashcards[currentIndex].question}
                </motion.p>
              </div>
              <div className="absolute bottom-3 w-full left-0 text-center text-xs text-gray-400">
                Click to {showAnswer ? "see question" : "reveal answer"}
              </div>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex justify-between items-center mt-6">
        <Button 
          variant="outline" 
          disabled={currentIndex === 0}
          onClick={handlePrevious}
          className="flex items-center gap-1"
        >
          <ChevronLeft size={16} />
          Previous
        </Button>
        
        <Button 
          onClick={handleFlip}
        >
          {showAnswer ? "Show Question" : "Show Answer"}
        </Button>
        
        <Button 
          variant="outline" 
          disabled={currentIndex === flashcards.length - 1}
          onClick={handleNext}
          className="flex items-center gap-1"
        >
          Next
          <ChevronRight size={16} />
        </Button>
      </div>
    </div>
  );
};
