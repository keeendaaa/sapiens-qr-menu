import logo from '../assets/logo.svg';
import { motion } from 'motion/react';

export function MenuHeader() {
  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
      className="relative overflow-hidden bg-gradient-to-br from-[#2a2a2a] to-[#1a1a1a] text-white py-8 px-4"
    >
      {/* Decorative background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-64 h-64 bg-[#eeecdd] rounded-full blur-3xl"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-[#eeecdd] rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="flex justify-center mb-4"
        >
          <img src={logo} alt="Sapiens" className="h-12 object-contain" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-center"
        >
          <p className="text-sm text-[#eeecdd] opacity-90 max-w-2xl mx-auto">
            Погрузитесь в мир изысканных вкусов и художественной подачи
          </p>
        </motion.div>
      </div>

      {/* Bottom wave decoration */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
          <path d="M0 48h1440V24c-120 16-240 24-360 24-240 0-480-24-720-24S120 40 0 24v24z" fill="#eeecdd"/>
        </svg>
      </div>
    </motion.header>
  );
}