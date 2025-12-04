import { useState, useEffect, useMemo } from 'react';
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
import dishCategoryMapping from '../dish_to_category.json';

// Функция для преобразования данных из menu.json в MenuItem[]
function loadMenuItemsFromJson(): MenuItem[] {
  const items: MenuItem[] = [];
  let id = 1;

  // Загружаем блюда в порядке из menu.json с правильными категориями
  for (const section of menuData.sections) {
    for (const item of section.items) {
      // Используем маппинг из dish_to_category.json, если есть
      const category = (dishCategoryMapping as Record<string, string>)[item.name] || 'appetizers';
      
      items.push({
        id: id++,
        name: item.name,
        description: item.portion || '',
        price: item.price.value,
        category: category as MenuItem['category'],
        image: 'default'
      });
    }
  }

  return items;
}

const menuItems: MenuItem[] = loadMenuItemsFromJson();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'recommendations' | 'menu' | 'ai'>('menu');
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  // Фильтруем блюда по категории, сохраняя порядок из menu.json
  const filteredItems = useMemo(() => {
    const items = selectedCategory === 'all' 
      ? menuItems 
      : menuItems.filter(item => item.category === selectedCategory);
    // Сохраняем порядок из menu.json для всех категорий
    return items;
  }, [selectedCategory, menuItems]);

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
            key={selectedItem.id}
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
