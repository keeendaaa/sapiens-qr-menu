import { motion } from 'motion/react';
import { UtensilsCrossed, Coffee, Cake, Wine } from 'lucide-react';
import { Category } from './types';

interface CategoryTabsProps {
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

// Категории, которые реально используются (есть блюда)
const categories: Category[] = [
  { id: 'all', name: 'Все', icon: 'utensils' },
  { id: 'appetizers', name: 'Закуски', icon: 'utensils' },
  { id: 'salads', name: 'Салаты', icon: 'utensils' },
  { id: 'mains', name: 'Горячие блюда', icon: 'utensils' },
  { id: 'soups', name: 'Супы', icon: 'utensils' },
  { id: 'khinkali', name: 'Хинкали', icon: 'utensils' },
  { id: 'bakery', name: 'Выпечка', icon: 'cake' },
  { id: 'sauces', name: 'Соусы', icon: 'utensils' },
];

const iconMap = {
  utensils: UtensilsCrossed,
  coffee: Coffee,
  cake: Cake,
  wine: Wine,
};

export function CategoryTabs({ selectedCategory, onSelectCategory }: CategoryTabsProps) {
  return (
    <div className="sticky top-0 z-40 bg-[#FFF8F0] border-b border-[#2a2a2a]/10 shadow-sm">
      <div className="overflow-x-auto scrollbar-hide">
        <div className="flex gap-2 px-3 py-2.5 min-w-max">
          {categories.map((category) => {
            const Icon = iconMap[category.icon as keyof typeof iconMap] || UtensilsCrossed;
            const isSelected = selectedCategory === category.id;
            
            return (
              <motion.button
                key={category.id}
                onClick={() => onSelectCategory(category.id)}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap transition-all text-xs ${
                  isSelected 
                    ? 'bg-[#2a2a2a] text-white shadow-md shadow-[#2a2a2a]/30' 
                    : 'bg-white text-[#2a2a2a] active:bg-[#2a2a2a]/5 border border-[#2a2a2a]/20'
                }`}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{category.name}</span>
                
                {isSelected && (
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-[#2a2a2a] rounded-full -z-10"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
}