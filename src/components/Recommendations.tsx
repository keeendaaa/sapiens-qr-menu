import { motion } from 'motion/react';
import { useState, useEffect, useMemo } from 'react';
import { MenuItem } from './types';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { Star, TrendingUp, Heart } from 'lucide-react';
import { getImageUrl } from './imageMap';

interface RecommendationsProps {
  menuItems: MenuItem[];
  onItemClick: (item: MenuItem) => void;
}

// Функция для рандомизации массива (Fisher-Yates shuffle)
const shuffleArray = <T,>(array: T[]): T[] => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const reasons = [
  'Самое популярное блюдо недели',
  'Выбор шеф-повара',
  'Любимое гостями',
  'Новое в меню',
  'Особенно рекомендуем',
  'Попробуйте обязательно',
];

const badges = ['popular', 'chef', 'favorite', 'new'] as const;

const badgeConfig = {
  popular: { icon: TrendingUp, label: 'Популярное', color: 'bg-[#212529]' },
  chef: { icon: Star, label: 'От шефа', color: 'bg-[#212529]' },
  favorite: { icon: Heart, label: 'Любимое', color: 'bg-[#212529]' },
  new: { icon: Star, label: 'Новинка', color: 'bg-[#212529]' },
};

export function Recommendations({ menuItems, onItemClick }: RecommendationsProps) {
  // Выбираем случайные блюда из существующих
  const recommendedItems = useMemo(() => {
    if (menuItems.length === 0) return [];
    
    // Берем случайные 4 блюда из всех доступных
    const shuffled = shuffleArray(menuItems);
    const selected = shuffled.slice(0, Math.min(4, menuItems.length));
    
    // Добавляем reason и badge к каждому блюду
    return selected.map((item, index) => ({
      ...item,
      reason: reasons[index % reasons.length],
      badge: badges[index % badges.length],
    }));
  }, [menuItems]);

  return (
    <div className="max-w-6xl mx-auto px-3 py-4" style={{ backgroundColor: '#eeecdd' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="mb-5">
          <h2 className="text-[#212529] mb-1">Рекомендации для вас</h2>
          <p className="text-[#212529]/70 text-sm">
            Специально подобранные блюда от нашего шеф-повара
          </p>
        </div>

        <div className="space-y-3">
          {recommendedItems.map((item, index) => {
            const badge = badgeConfig[item.badge as keyof typeof badgeConfig];
            const BadgeIcon = badge.icon;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                onClick={() => onItemClick(item)}
                className="bg-[#eeecdd] rounded-xl overflow-hidden shadow-md active:shadow-xl transition-all cursor-pointer"
              >
                <div className="flex gap-3 p-3">
                  {/* Image */}
                  <div className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-[#212529]/5 to-[#eeecdd]">
                    {getImageUrl(item.name) ? (
                      <ImageWithFallback
                        src={getImageUrl(item.name)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-[#212529]/10 flex items-center justify-center">
                          <svg className="w-6 h-6 text-[#212529]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                      </div>
                    )}
                    
                    {/* Badge */}
                    <div className={`absolute top-1.5 left-1.5 ${badge.color} text-[#eeecdd] px-1.5 py-0.5 rounded-full flex items-center gap-1 text-[10px]`}>
                      <BadgeIcon className="w-2.5 h-2.5" />
                      <span>{badge.label}</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <h3 className="text-[#212529] mb-0.5 text-base">{item.name}</h3>
                      <p className="text-[#212529]/70 text-xs line-clamp-2 mb-1">
                        {item.description}
                      </p>
                      <p className="text-[#212529]/70 text-xs italic">
                        {item.reason}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between mt-2">
                      <div className="px-3 py-1.5 rounded-full text-sm" style={{ backgroundColor: '#212529', color: '#eeecdd' }}>
                        <span style={{ color: '#eeecdd' }}>{item.price} ₽</span>
                      </div>
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        className="bg-[#212529] text-[#eeecdd] px-3 py-1.5 rounded-lg text-xs"
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemClick(item);
                        }}
                      >
                        Подробнее
                      </motion.button>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}