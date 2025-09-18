import { useState } from "react";
import { X, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import RobotCharacter from "./RobotCharacter";

export default function FloatingChat() {
  const [isOpen, setIsOpen] = useState(true);
  const [isMinimized, setIsMinimized] = useState(false);

  const toggleChat = () => {
    if (isMinimized) {
      setIsMinimized(false);
    } else {
      setIsOpen(!isOpen);
    }
  };

  const minimizeChat = () => {
    setIsMinimized(true);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50" data-testid="floating-chat">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className={cn(
              "glass-card rounded-2xl max-w-sm transition-all duration-300",
              isMinimized ? "p-2" : "p-4"
            )}
            data-testid="chat-widget"
          >
            {!isMinimized ? (
              <>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="w-10 h-10">
                    <RobotCharacter size="sm" />
                  </div>
                  <div className="flex-1">
                    <div className="text-white font-medium text-sm">EduBot</div>
                    <div className="text-white/70 text-xs">Your Learning Assistant</div>
                  </div>
                  <button
                    onClick={minimizeChat}
                    className="text-white/70 hover:text-white transition-colors"
                    data-testid="minimize-chat"
                  >
                    <MessageCircle className="w-4 h-4" />
                  </button>
                  <button
                    onClick={toggleChat}
                    className="text-white/70 hover:text-white transition-colors"
                    data-testid="close-chat"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="bg-white/10 rounded-lg p-3 mb-3">
                  <p className="text-white/90 text-sm">
                    Welcome, AstroBeth! Ready to boost your learning orbit today?
                  </p>
                </div>
                <button
                  className="w-full bg-gradient-to-r from-primary to-accent text-white py-2 rounded-lg text-sm font-medium hover:shadow-lg transition-all"
                  data-testid="chat-button"
                >
                  Chat with EduBot
                </button>
              </>
            ) : (
              <button
                onClick={toggleChat}
                className="w-12 h-12 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center"
                data-testid="expand-chat"
              >
                <MessageCircle className="text-white w-6 h-6" />
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {!isOpen && (
        <motion.button
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          onClick={toggleChat}
          className="w-14 h-14 bg-gradient-to-r from-primary to-accent rounded-full flex items-center justify-center shadow-lg hover:shadow-xl transition-all"
          data-testid="open-chat"
        >
          <MessageCircle className="text-white w-6 h-6" />
        </motion.button>
      )}
    </div>
  );
}

function cn(...classes: (string | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}
