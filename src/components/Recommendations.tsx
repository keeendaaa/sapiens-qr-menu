import React, { useMemo } from 'react';
import { motion } from 'motion/react';
import { MenuItem } from './types';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { TrendingUp, ChefHat, Clock, Award } from 'lucide-react';

interface RecommendationsProps {
  onItemClick: (item: MenuItem) => void;
  menuItems: MenuItem[];
}

// Функция для случайного перемешивания массива
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export function Recommendations({ onItemClick, menuItems }: RecommendationsProps) {
  // Генерируем случайные рекомендации из реальных блюд
  const recommendations = useMemo(() => {
    if (menuItems.length === 0) {
      return {
        popular: [],
        chef: [],
        quick: [],
        signature: [],
      };
    }

    const shuffled = shuffleArray(menuItems);
    
    return {
      popular: shuffled.slice(0, 3), // Хиты недели - 3 случайных блюда
      chef: shuffled.slice(3, 5), // Выбор шеф-повара - 2 случайных блюда
      quick: shuffled.slice(5, 7), // Быстрые блюда - 2 случайных блюда
      signature: shuffled.slice(7, 8), // Фирменное блюдо - 1 случайное блюдо
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
            <h2 className="text-xl font-semibold" style={{ color: '#212529' }}>Хиты недели</h2>
            <p className="text-xs" style={{ color: '#212529', opacity: 0.7 }}>Самые популярные блюда</p>
          </div>
        </div>

        <div className="overflow-x-auto -mx-3 px-3 scrollbar-hide">
          <div className="flex gap-3 pb-2 mb-6 min-w-max">
            {recommendations.popular.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1, duration: 0.4 }}
                onClick={() => onItemClick(item)}
                className="flex-shrink-0 w-64 h-64 rounded-2xl overflow-hidden shadow-md active:scale-95 transition-transform cursor-pointer flex flex-col"
                style={{ backgroundColor: '#eeecdd' }}
              >
                <div className="relative w-full h-48 flex-shrink-0 overflow-hidden">
                    {false ? (
                      <ImageWithFallback
                        src=""
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
                <div className="p-4 flex-1 flex flex-col justify-center min-h-0" style={{ height: '64px' }}>
                  <h3 className="font-medium mb-1 line-clamp-1" style={{ color: '#212529' }}>{item.name}</h3>
                  <p className="text-sm line-clamp-1" style={{ color: '#212529', opacity: 0.7 }}>{item.description || ''}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Chef's Choice Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl shadow-lg" style={{ backgroundColor: '#212529' }}>
            <ChefHat className="w-5 h-5" style={{ color: '#eeecdd' }} />
          </div>
          <div>
            <h2 className="text-xl font-semibold" style={{ color: '#212529' }}>Выбор шеф-повара</h2>
            <p className="text-xs" style={{ color: '#212529', opacity: 0.7 }}>Авторские рецепты</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {recommendations.chef.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 + index * 0.1, duration: 0.4 }}
              onClick={() => onItemClick(item)}
              className="rounded-xl overflow-hidden shadow-md active:scale-95 transition-transform cursor-pointer"
              style={{ backgroundColor: '#eeecdd' }}
            >
              <div className="relative h-32 overflow-hidden">
                {false ? (
                  <ImageWithFallback
                    src=""
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
                <div className="absolute top-2 right-2 px-2 py-1 rounded-lg text-xs shadow-md flex items-center gap-1" style={{ backgroundColor: '#212529', color: '#eeecdd' }}>
                  <ChefHat className="w-3 h-3" />
                  <span>Шеф</span>
                </div>
              </div>
              <div className="p-3">
                <h3 className="text-sm font-medium mb-1 line-clamp-1" style={{ color: '#212529' }}>{item.name}</h3>
                <p className="text-xs mb-2 line-clamp-2" style={{ color: '#212529', opacity: 0.7 }}>{item.description}</p>
                {item.price !== undefined && (
                  <span style={{ color: '#212529' }}>{item.price} ₽</span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Quick Meals Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mb-8"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 rounded-xl shadow-lg" style={{ backgroundColor: '#212529' }}>
            <Clock className="w-5 h-5" style={{ color: '#eeecdd' }} />
          </div>
                    <div>
            <h2 className="text-xl font-semibold" style={{ color: '#212529' }}>Быстрые блюда</h2>
            <p className="text-xs" style={{ color: '#212529', opacity: 0.7 }}>Приготовим за 15 минут</p>
          </div>
                    </div>
                    
        <div className="overflow-x-auto -mx-3 px-3 scrollbar-hide">
          <div className="flex gap-3 pb-2 min-w-max">
            {recommendations.quick.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1, duration: 0.4 }}
                onClick={() => onItemClick(item)}
                className="flex-shrink-0 w-64 rounded-2xl overflow-hidden shadow-md active:scale-95 transition-transform cursor-pointer"
                style={{ backgroundColor: '#eeecdd' }}
              >
                <div className="relative h-40 overflow-hidden">
                  {false ? (
                    <ImageWithFallback
                      src=""
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
                  <div className="absolute top-3 left-3 px-2 py-0.5 rounded-full text-[10px] flex items-center gap-1" style={{ backgroundColor: '#212529', opacity: 0.8, color: '#eeecdd' }}>
                    <Clock className="w-2.5 h-2.5" />
                    <span>15 мин</span>
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-medium mb-1 line-clamp-1" style={{ color: '#212529' }}>{item.name}</h3>
                  <p className="text-sm line-clamp-2" style={{ color: '#212529', opacity: 0.7 }}>{item.description || ''}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Signature Dish Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
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
            transition={{ delay: 0.4 + index * 0.1, duration: 0.4 }}
            onClick={() => onItemClick(item)}
            className="rounded-2xl overflow-hidden shadow-lg active:scale-98 transition-transform cursor-pointer border"
            style={{ 
              backgroundColor: '#eeecdd',
              borderColor: 'rgba(33, 37, 41, 0.2)'
            }}
          >
            <div className="relative h-48 overflow-hidden">
              {false ? (
                <ImageWithFallback
                  src=""
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
                <h3 className="mb-1 font-medium" style={{ color: '#eeecdd' }}>{item.name}</h3>
                <p className="text-sm" style={{ color: '#eeecdd', opacity: 0.9 }}>{item.description}</p>
              </div>
            </div>
            <div className="p-4" style={{ backgroundColor: '#eeecdd' }}>
              <div className="flex items-center justify-between">
                {item.price !== undefined && (
                  <span style={{ color: '#212529' }}>{item.price} ₽</span>
                )}
                <span className="text-xs" style={{ color: '#212529', opacity: 0.6 }}>Нажмите для подробностей</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}