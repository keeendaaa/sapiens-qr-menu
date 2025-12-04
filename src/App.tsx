import React, { useState, useMemo } from 'react';
import { AnimatePresence } from 'motion/react';
import { MenuHeader } from './components/MenuHeader';
import { CategoryTabs } from './components/CategoryTabs';
import { MenuGrid } from './components/MenuGrid';
import { MenuItem } from './components/types';
import { BottomNav } from './components/BottomNav';
import { Recommendations } from './components/Recommendations';
import { AIWaiter } from './components/AIWaiter';
import { MenuDetailModal } from './components/MenuDetailModal';
import { LoadingScreen } from './components/LoadingScreen';
import menuData from '../menu.json';

// Преобразуем данные из menu.json в формат MenuItem[]
const menuItems: MenuItem[] = menuData.all_items || [];

// Получаем список категорий из данных меню
const categories = menuData.menu?.categories?.map(cat => ({
  id: cat.name.toLowerCase().replace(/\s+/g, '-'),
  name: cat.name,
  icon: getCategoryIcon(cat.name)
})) || [];

function getCategoryIcon(categoryName: string): string {
  const lowerName = categoryName.toLowerCase();
  if (lowerName.includes('десерт')) return 'cake';
  if (lowerName.includes('рыба') || lowerName.includes('морепродукт') || lowerName.includes('суши') || lowerName.includes('ролл')) return 'fish';
  if (lowerName.includes('мясн')) return 'chef';
  if (lowerName.includes('салат')) return 'utensils';
  if (lowerName.includes('суп')) return 'utensils';
  if (lowerName.includes('завтрак')) return 'coffee';
  if (lowerName.includes('закуск')) return 'utensils';
  return 'utensils';
}

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'recommendations' | 'menu' | 'ai'>('menu');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  const filteredItems = useMemo(() => {
    if (selectedCategory === 'all') {
      return menuItems;
    }
    const categoryName = categories.find(cat => cat.id === selectedCategory)?.name;
    if (!categoryName) return menuItems;
    return menuItems.filter(item => item.category === categoryName);
  }, [selectedCategory]);

  return (
    <>
      <AnimatePresence>
        {isLoading && (
          <LoadingScreen onComplete={() => setIsLoading(false)} />
        )}
      </AnimatePresence>
      
      {!isLoading && (
        <div className="min-h-screen bg-[#eeecdd] pb-16">
          <MenuHeader />
          
          {activeTab === 'menu' && (
            <>
              <CategoryTabs 
                selectedCategory={selectedCategory}
                onSelectCategory={setSelectedCategory}
                categories={categories}
              />
              <MenuGrid items={filteredItems} onItemClick={setSelectedItem} />
            </>
          )}

          {activeTab === 'recommendations' && <Recommendations menuItems={menuItems} onItemClick={setSelectedItem} />}
          
          {activeTab === 'ai' && <AIWaiter menuItems={menuItems} onItemClick={setSelectedItem} />}

          <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
          
      <AnimatePresence>
        {selectedItem && (
          <MenuDetailModal 
            item={selectedItem}
            menuItems={menuItems}
            onClose={() => setSelectedItem(null)}
            onItemClick={setSelectedItem}
          />
        )}
      </AnimatePresence>
        </div>
      )}
    </>
  );
}
