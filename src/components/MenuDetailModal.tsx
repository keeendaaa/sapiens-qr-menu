import React, { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { MenuItem } from './types';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { X } from 'lucide-react';
import { getImageUrl } from './imageMap';

interface MenuDetailModalProps {
  item: MenuItem;
  menuItems: MenuItem[];
  onClose: () => void;
  onItemClick: (item: MenuItem) => void;
}

export function MenuDetailModal({ item, menuItems, onClose, onItemClick }: MenuDetailModalProps) {
  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Находим похожие блюда из той же категории
  const similarItems = useMemo(() => {
    const sameCategory = menuItems.filter(
      menuItem => menuItem.category === item.category && menuItem.id !== item.id
    );
    
    // Перемешиваем и берем первые 4
    const shuffled = [...sameCategory].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 4);
  }, [item, menuItems]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, y: 100 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 100 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative rounded-t-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl"
        style={{ backgroundColor: '#eeecdd' }}
      >
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 bg-[#eeecdd]/90 backdrop-blur-sm p-2 rounded-full shadow-lg active:bg-[#eeecdd] transition-colors"
          >
            <X className="w-5 h-5 text-[#212529]" />
          </button>

          {/* Image */}
          <div className="relative h-64 overflow-hidden bg-gradient-to-br from-[#212529]/5 to-[#eeecdd]">
            {getImageUrl(item.name) ? (
              <ImageWithFallback
                src={getImageUrl(item.name)}
                alt={item.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="w-20 h-20 mx-auto mb-2 rounded-full bg-[#212529]/10 flex items-center justify-center">
                    <svg className="w-10 h-10 text-[#212529]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                  <p className="text-[#212529]/40 text-sm">Фото</p>
                </div>
              </div>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>

          {/* Content */}
          <div className="p-5">
            <div className="flex items-start justify-between gap-3 mb-3">
              <h2 className="text-[#212529]">{item.name}</h2>
              <div className="px-3 py-1.5 rounded-full shrink-0 text-sm" style={{ backgroundColor: '#212529', color: '#eeecdd' }}>
                <span style={{ color: '#eeecdd' }}>{item.price} ₽</span>
              </div>
            </div>

            {item.description && (
              <p className="text-[#212529]/70 mb-5 text-sm">
                {item.description}
              </p>
            )}

            {/* Похожие блюда */}
            {similarItems.length > 0 && (
              <div className="mt-6 pt-5 border-t border-[#212529]/10">
                <h3 className="text-[#212529] font-semibold mb-4 text-lg">Похожие блюда</h3>
                <div className="grid grid-cols-2 gap-3">
                  {similarItems.map((similarItem) => (
                    <motion.div
                      key={similarItem.id}
                      className="bg-[#eeecdd] rounded-lg overflow-hidden shadow-sm border border-[#212529]/10 cursor-pointer active:shadow-md transition-shadow"
                      onClick={() => {
                        onItemClick(similarItem);
                      }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <div className="relative h-24 overflow-hidden bg-gradient-to-br from-[#212529]/5 to-[#eeecdd]">
                        {getImageUrl(similarItem.name) ? (
                          <ImageWithFallback
                            src={getImageUrl(similarItem.name)}
                            alt={similarItem.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-[#212529]/10 flex items-center justify-center">
                              <svg className="w-4 h-4 text-[#212529]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="p-2">
                        <h4 className="text-[#212529] text-xs font-medium line-clamp-2 mb-1">
                          {similarItem.name}
                        </h4>
                        <p className="text-[#212529] text-xs font-semibold">
                          {similarItem.price} ₽
                        </p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
  );
}