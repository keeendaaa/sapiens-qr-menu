import { motion } from 'motion/react';
import { Sparkles, UtensilsCrossed, Bot } from 'lucide-react';

interface BottomNavProps {
  activeTab: 'recommendations' | 'menu' | 'ai';
  onTabChange: (tab: 'recommendations' | 'menu' | 'ai') => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  const tabs = [
    { id: 'recommendations' as const, label: 'Рекомендации', icon: Sparkles },
    { id: 'menu' as const, label: 'Меню', icon: UtensilsCrossed },
    { id: 'ai' as const, label: 'AI Официант', icon: Bot },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-2 border-[#C41E3A]/10 shadow-2xl z-50 safe-area-inset-bottom">
      <div className="max-w-6xl mx-auto px-2">
        <div className="flex justify-around items-center h-16">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => onTabChange(tab.id)}
                className="relative flex flex-col items-center justify-center gap-0.5 px-4 py-2 transition-all min-w-0 flex-1"
              >
                <motion.div
                  animate={{
                    scale: isActive ? 1.1 : 1,
                    y: isActive ? -2 : 0,
                  }}
                  transition={{ duration: 0.2 }}
                  className={`relative ${
                    isActive ? 'text-[#C41E3A]' : 'text-gray-400'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-[#C41E3A] rounded-full"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </motion.div>

                <span
                  className={`text-[10px] transition-colors leading-tight text-center ${
                    isActive ? 'text-[#C41E3A]' : 'text-gray-400'
                  }`}
                >
                  {tab.label}
                </span>

                {isActive && (
                  <motion.div
                    layoutId="activeBar"
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#C41E3A] rounded-full"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}