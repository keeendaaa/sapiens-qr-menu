import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { MenuItem } from './types';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { TrendingUp, Award, Sparkles } from 'lucide-react';
import { getMenuImageUrl } from '../utils/imageUtils';
import { cleanText } from '../utils/textUtils';

interface RecommendationsProps {
  onItemClick: (item: MenuItem) => void;
  menuItems: MenuItem[];
}

export function Recommendations({ onItemClick, menuItems }: RecommendationsProps) {
  // Генерируем рекомендации с конкретными блюдами
  const recommendations = useMemo(() => {
    if (menuItems.length === 0) {
      return {
        popular: [],
        interested: [],
        signature: [],
      };
    }

    // Функция для поиска блюда по названию (частичное совпадение)
    const findDishByName = (searchName: string): MenuItem | null => {
      const searchLower = searchName.toLowerCase();
      return menuItems.find(item => {
        const nameLower = item.name?.toLowerCase() || '';
        return nameLower.includes(searchLower) || searchLower.includes(nameLower);
      }) || null;
    };

    // Функция для поиска блюда по ключевым словам
    const findDishByKeywords = (keywords: string[]): MenuItem | null => {
      return menuItems.find(item => {
        const name = item.name?.toLowerCase() || '';
        const description = item.description?.toLowerCase() || '';
        const composition = item.composition?.toLowerCase() || '';
        const text = `${name} ${description} ${composition}`;
        
        return keywords.every(keyword => text.includes(keyword.toLowerCase()));
      }) || null;
    };

    // Биохакинг (бывшие "Хиты недели") - конкретные блюда
    const popularDishes = [
      findDishByName('Stefan salad') || findDishByName('салат стефан'),
      findDishByName('Маринованные креветки'),
      findDishByKeywords(['судак', 'чёрный рис']) || findDishByKeywords(['судак', 'черный рис']) || findDishByKeywords(['судак', 'ризотто']) || findDishByName('судак'),
    ].filter((item): item is MenuItem => item !== null);

    // Интересуются - конкретные блюда
    const interestedDishes = [
      findDishByKeywords(['паштет', 'утк', 'угр']) || findDishByName('Паштет из утки'),
      findDishByKeywords(['судак', 'чёрный рис']) || findDishByKeywords(['судак', 'черный рис']) || findDishByKeywords(['судак', 'ризотто']) || findDishByKeywords(['полба', 'судак', 'рис']),
    ].filter((item): item is MenuItem => item !== null);

    // Фирменное блюдо - шаурма
    const signatureDish = findDishByName('Шаурма') || findDishByName('шаурма');
    
    return {
      popular: popularDishes.slice(0, 3), // Биохакинг - конкретные 3 блюда
      interested: interestedDishes.slice(0, 2), // Интересуются - 2 блюда
      signature: signatureDish ? [signatureDish] : [], // Фирменное блюдо - маринованные креветки
    };
  }, [menuItems]);

  if (menuItems.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-3 py-6 pb-24" style={{ backgroundColor: '#eeecdd' }}>
        <div className="text-center py-20">
          <p className="text-[#212529]/60 text-lg">Загрузка рекомендаций...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 py-6 pb-24" style={{ backgroundColor: '#eeecdd' }}>
      {/* Popular Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl shadow-lg" style={{ backgroundColor: '#212529' }}>
            <TrendingUp className="w-5 h-5" style={{ color: '#eeecdd' }} />
          </div>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: '#212529' }}>Биохакинг</h2>
            <p className="text-xs" style={{ color: '#212529', opacity: 0.7 }}>Самые популярные блюда</p>
          </div>
        </div>

        {recommendations.popular.length < 3 ? (
          // Grid для менее чем 3 блюд
          <div className={recommendations.popular.length === 1 ? "grid grid-cols-1 gap-3" : "grid grid-cols-2 gap-3"}>
            {recommendations.popular.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                onClick={() => onItemClick(item)}
                className="rounded-xl overflow-hidden shadow-md active:scale-95 transition-transform cursor-pointer flex flex-col"
                style={{ backgroundColor: '#eeecdd' }}
              >
                <div className="relative w-full h-48 flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#212529]/5 to-[#eeecdd]">
                    {item.image ? (
                      <ImageWithFallback
                        src={getMenuImageUrl(item.image)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#eeecdd' }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#212529', opacity: 0.1 }}>
                        <svg className="w-6 h-6" style={{ color: '#212529', opacity: 0.3 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                      </div>
                    )}
                  {item.price !== undefined && (
                    <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm" style={{ backgroundColor: 'rgba(238, 236, 221, 0.95)' }}>
                      <span style={{ color: '#212529' }}>{item.price} ₽</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col min-h-0">
                  <h3 className="font-medium mb-1.5 line-clamp-2" style={{ color: '#212529' }}>{item.name}</h3>
                  {item.description && (
                    <p className="text-sm line-clamp-2 flex-1" style={{ color: '#212529', opacity: 0.7 }}>{cleanText(item.description)}</p>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          // Горизонтальный скролл для 3+ блюд
          <div className="overflow-x-auto -mx-3 px-3 scrollbar-hide">
            <div className="flex gap-3 pb-2 mb-6 min-w-max">
              {recommendations.popular.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1, duration: 0.4 }}
                  onClick={() => onItemClick(item)}
                  className="flex-shrink-0 w-64 rounded-2xl overflow-hidden shadow-md active:scale-95 transition-transform cursor-pointer flex flex-col"
                  style={{ backgroundColor: '#eeecdd' }}
                >
                  <div className="relative w-full h-48 flex-shrink-0 overflow-hidden bg-gradient-to-br from-[#212529]/5 to-[#eeecdd]">
                    {item.image ? (
                      <ImageWithFallback
                        src={getMenuImageUrl(item.image)}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#eeecdd' }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#212529', opacity: 0.1 }}>
                        <svg className="w-6 h-6" style={{ color: '#212529', opacity: 0.3 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                        </div>
                      </div>
                    )}
                  {item.price !== undefined && (
                    <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm" style={{ backgroundColor: 'rgba(238, 236, 221, 0.95)' }}>
                      <span style={{ color: '#212529' }}>{item.price} ₽</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col min-h-0">
                  <h3 className="font-medium mb-1.5 line-clamp-2" style={{ color: '#212529' }}>{item.name}</h3>
                  {item.description && (
                    <p className="text-sm line-clamp-2 flex-1" style={{ color: '#212529', opacity: 0.7 }}>{cleanText(item.description)}</p>
                  )}
                </div>
              </motion.div>
            ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Interested Section */}
      {recommendations.interested.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl shadow-lg" style={{ backgroundColor: '#212529' }}>
              <Sparkles className="w-5 h-5" style={{ color: '#eeecdd' }} />
            </div>
            <div>
              <h2 className="text-xl font-semibold" style={{ color: '#212529' }}>Интересуются</h2>
              <p className="text-xs" style={{ color: '#212529', opacity: 0.7 }}>Популярные блюда</p>
            </div>
          </div>

          <div className={recommendations.interested.length === 1 ? "grid grid-cols-1 gap-3" : "grid grid-cols-2 gap-3"}>
            {recommendations.interested.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.15 + index * 0.1, duration: 0.4 }}
                onClick={() => onItemClick(item)}
                className="rounded-xl overflow-hidden shadow-md active:scale-95 transition-transform cursor-pointer flex flex-col"
                style={{ backgroundColor: '#eeecdd' }}
              >
                <div className="relative w-full h-48 overflow-hidden flex-shrink-0 bg-gradient-to-br from-[#212529]/5 to-[#eeecdd]">
                  {item.image ? (
                    <ImageWithFallback
                      src={getMenuImageUrl(item.image)}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#eeecdd' }}>
                      <div className="w-12 h-12 rounded-full flex items-center justify-center" style={{ backgroundColor: '#212529', opacity: 0.1 }}>
                        <svg className="w-6 h-6" style={{ color: '#212529', opacity: 0.3 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                    </div>
                  )}
                  {item.price !== undefined && (
                    <div className="absolute top-3 right-3 px-3 py-1.5 rounded-full shadow-lg backdrop-blur-sm" style={{ backgroundColor: 'rgba(238, 236, 221, 0.95)' }}>
                      <span style={{ color: '#212529' }}>{item.price} ₽</span>
                    </div>
                  )}
                </div>
                <div className="p-4 flex flex-col flex-1 min-h-0">
                  <h3 className="text-sm font-medium mb-2 line-clamp-2" style={{ color: '#212529' }}>{item.name}</h3>
                  {item.description && (
                    <p className="text-xs mb-3 line-clamp-2 flex-1" style={{ color: '#212529', opacity: 0.7 }}>{cleanText(item.description)}</p>
                  )}
                  {item.price !== undefined && (
                    <span className="text-sm font-semibold mt-auto" style={{ color: '#212529' }}>{item.price} ₽</span>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Signature Dish Section */}
      {recommendations.signature.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl shadow-lg" style={{ backgroundColor: '#212529' }}>
            <Award className="w-5 h-5" style={{ color: '#eeecdd' }} />
          </div>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: '#212529' }}>Фирменное блюдо</h2>
            <p className="text-xs" style={{ color: '#212529', opacity: 0.7 }}>Гордость нашего ресторана</p>
          </div>
        </div>

        {recommendations.signature.map((item, index) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
            onClick={() => onItemClick(item)}
            className="rounded-2xl overflow-hidden shadow-lg active:scale-98 transition-transform cursor-pointer border"
            style={{ 
              backgroundColor: '#eeecdd',
              borderColor: 'rgba(33, 37, 41, 0.2)'
            }}
          >
            <div className="relative w-full h-48 overflow-hidden bg-gradient-to-br from-[#212529]/5 to-[#eeecdd]">
              {item.image ? (
                <ImageWithFallback
                  src={getMenuImageUrl(item.image)}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#eeecdd' }}>
                  <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ backgroundColor: '#212529', opacity: 0.1 }}>
                    <svg className="w-8 h-8" style={{ color: '#212529', opacity: 0.3 }} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                  </div>
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              <div className="absolute top-3 left-3 px-3 py-1.5 rounded-full text-xs shadow-lg flex items-center gap-1.5" style={{ backgroundColor: '#212529', color: '#eeecdd' }}>
                <Award className="w-3.5 h-3.5" />
                <span>Фирменное блюдо</span>
              </div>
              <div className="absolute bottom-3 left-3 right-3">
                <h3 className="mb-1.5 font-medium line-clamp-2" style={{ color: '#eeecdd' }}>{item.name}</h3>
                {item.description && (
                  <p className="text-sm line-clamp-2" style={{ color: '#eeecdd', opacity: 0.9 }}>{cleanText(item.description)}</p>
                )}
              </div>
            </div>
            <div className="p-4 flex-shrink-0" style={{ backgroundColor: '#eeecdd' }}>
              <div className="flex items-center justify-between">
                {item.price !== undefined && (
                  <span className="text-sm font-semibold" style={{ color: '#212529' }}>{item.price} ₽</span>
                )}
                <span className="text-xs" style={{ color: '#212529', opacity: 0.6 }}>Нажмите для подробностей</span>
              </div>
            </div>
          </motion.div>
        ))}
        </motion.div>
      )}
    </div>
  );
}