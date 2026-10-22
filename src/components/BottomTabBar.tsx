import React from 'react';
import { Gamepad2, Trophy, Users, History, BookOpen } from 'lucide-react';

interface BottomTabBarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  hasActiveGame: boolean;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({
  activeTab,
  setActiveTab,
  hasActiveGame,
}) => {
  const tabs = [
    {
      id: 'game',
      label: 'Game',
      icon: Gamepad2,
      badge: hasActiveGame ? 'LIVE' : undefined,
    },
    {
      id: 'leaderboard',
      label: 'Rankings',
      icon: Trophy,
    },
    {
      id: 'players',
      label: 'Players',
      icon: Users,
    },
    {
      id: 'history',
      label: 'History',
      icon: History,
    },
    {
      id: 'rules',
      label: 'Rules',
      icon: BookOpen,
    },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#071322]/95 backdrop-blur-md border-t border-slate-200 dark:border-[#1b3558] pb-safe md:hidden shadow-lg dark:shadow-none transition-colors"
      aria-label="Bottom Navigation"
    >
      <div className="grid grid-cols-5 items-center h-15 max-w-lg mx-auto px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`touch-btn relative flex flex-col items-center justify-center min-h-[48px] py-1 transition-all duration-150 ${
                isActive ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-blue-300/70 hover:text-slate-800 dark:hover:text-blue-100'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.4] text-amber-600 dark:text-amber-400' : 'stroke-[1.8]'
                  }`}
                />
                {tab.badge && (
                  <span className="absolute -top-1 -right-2.5 px-1 py-0.2 bg-rose-600 text-white text-[8px] font-extrabold rounded-full animate-pulse border border-white dark:border-[#071322]">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] tracking-tight mt-1 truncate ${isActive ? 'text-amber-600 dark:text-amber-400 font-bold' : 'text-slate-500 dark:text-blue-300/70'}`}>
                {tab.label}
              </span>
              {isActive && (
                <span className="absolute bottom-1 w-1 h-1 bg-amber-500 dark:bg-amber-400 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
