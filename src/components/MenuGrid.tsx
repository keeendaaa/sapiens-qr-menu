import React from 'react';
import { motion } from 'motion/react';
import { MenuItem } from './types';
import { MenuCard } from './MenuCard';
import { getMenuImageUrl } from '../utils/imageUtils';

interface MenuGridProps {
  items: MenuItem[];
  onItemClick: (item: MenuItem) => void;
}

export function MenuGrid({ items, onItemClick }: MenuGridProps) {
  return (
    <div className="max-w-6xl mx-auto px-3 py-4" style={{ backgroundColor: '#eeecdd' }}>
      <motion.div 
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        {items.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ 
              delay: index * 0.05,
              duration: 0.4,
              ease: "easeOut"
            }}
          >
            <MenuCard 
              item={item} 
              imageUrl={getMenuImageUrl(item.image)} 
              onClick={() => onItemClick(item)} 
            />
          </motion.div>
        ))}
      </motion.div>

      {items.length === 0 && (
        <div className="text-center py-20">
          <p className="text-[#212529]/60 text-lg">Блюда не найдены</p>
        </div>
      )}
    </div>
  );
}