import React, { useState } from 'react';
import { motion } from 'motion/react';
import { MenuItem } from './types';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface MenuCardProps {
  item: MenuItem;
  imageUrl: string;
  onClick: () => void;
}

export function MenuCard({ item, imageUrl, onClick }: MenuCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      className="bg-[#eeecdd] rounded-xl overflow-hidden shadow-md active:shadow-xl transition-shadow duration-300 group cursor-pointer"
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
    >
      {/* Image Container */}
      <div className="relative h-64 overflow-hidden bg-gradient-to-br from-[#212529]/5 to-[#eeecdd]">
        {imageUrl ? (
          <motion.div
            animate={{ scale: isHovered ? 1.1 : 1 }}
            transition={{ duration: 0.4 }}
          >
            <ImageWithFallback
              src={imageUrl}
              alt={item.name}
              className="w-full h-64 object-cover"
            />
          </motion.div>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 rounded-full bg-[#212529]/10 flex items-center justify-center">
                <svg className="w-8 h-8 text-[#212529]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </div>
              <p className="text-[#212529]/40 text-xs">Фото</p>
            </div>
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        {/* Price badge */}
        {item.price !== undefined && (
          <motion.div
            className="absolute top-3 right-3 px-3 py-1.5 rounded-full shadow-lg text-sm"
            style={{ backgroundColor: '#212529', color: '#eeecdd' }}
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ 
              type: "spring",
              stiffness: 260,
              damping: 20,
              delay: 0.1
            }}
          >
            <span style={{ color: '#eeecdd' }}>{item.price} ₽</span>
          </motion.div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-[#212529] mb-1.5">{item.name}</h3>
        
        {item.description && (
          <p className="text-[#212529]/70 text-sm line-clamp-2">
            {item.description.replace(/^\s*\*\s*/gm, '').trim()}
          </p>
        )}
      </div>

      {/* Decorative corner accent */}
      <div className="absolute bottom-0 right-0 w-20 h-20 opacity-5 pointer-events-none">
        <div className="absolute bottom-0 right-0 w-full h-full bg-[#212529] rounded-tl-full" />
      </div>
    </motion.div>
  );
}