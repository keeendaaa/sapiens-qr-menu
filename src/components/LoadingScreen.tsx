import { motion } from 'motion/react';
import { useEffect } from 'react';
import loadLogo from '../assets/load-logo.svg';

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  useEffect(() => {
    // Завершение загрузки через 1.5 секунды
    const timer = setTimeout(() => {
      onComplete();
    }, 1500);

    return () => {
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: '#212529' }}
    >
      <div className="flex flex-col items-center">
        {/* Logo */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 15,
            duration: 0.6
          }}
          className="relative"
        >
          <img 
            src={loadLogo} 
            alt="Sapiens" 
            className="w-40 h-auto max-w-[200px]"
          />
        </motion.div>
      </div>
    </motion.div>
  );
}

