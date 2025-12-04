import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
import loadLogo from '../assets/load-logo.svg';

interface LoadingScreenProps {
  onComplete: () => void;
}

export function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    // Анимация прогресса загрузки
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    // Завершение загрузки через 1.5 секунды
    const timer = setTimeout(() => {
      onComplete();
    }, 1500);

    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#eeecdd]"
    >
      <div className="flex flex-col items-center gap-6">
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
            className="w-24 h-auto max-w-[100px]"
          />
        </motion.div>

        {/* Progress Bar */}
        <div className="w-64 h-1 bg-[#212529]/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-[#212529] rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
        </div>

        {/* Loading Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-[#212529]/60 text-sm font-medium"
        >
          Загрузка меню...
        </motion.p>
      </div>
    </motion.div>
  );
}

