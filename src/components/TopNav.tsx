import React, { useState } from 'react';
import { Volume2, VolumeX, PlusCircle, HelpCircle } from 'lucide-react';
import { soundManager } from '../utils/audio';
import brandIcon from '../assets/images/cards4life_brand_icon_1792466194467.jpg';

interface TopNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewGameClick: () => void;
  hasActiveGame: boolean;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  onNewGameClick,
  hasActiveGame,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());

  const handleToggleSound = () => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-emerald-950/60 pt-safe">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Brand Wordmark */}
        <div
          onClick={() => setActiveTab('game')}
          className="flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0 group"
        >
          <div className="w-8 h-8 rounded-lg overflow-hidden border border-amber-500/30 shadow-sm shrink-0">
            <img
              src={brandIcon}
              alt="Cards 4 Life"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
          </div>
          <span className="font-display font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
            Cards 4 Life
            <span className="text-amber-400 text-xs font-semibold px-1.5 py-0.5 rounded bg-amber-950/50 border border-amber-500/30 hidden sm:inline-block">
              ♠ ♥ ♦ ♣
            </span>
          </span>
        </div>

        {/* Zone 2: Navigation Links (desktop & tablet) */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <button
            type="button"
            onClick={() => setActiveTab('game')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'game' ? 'text-amber-400 font-semibold' : 'hover:text-white'
            }`}
          >
            Active Table {hasActiveGame && '•'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'leaderboard' ? 'text-amber-400 font-semibold' : 'hover:text-white'
            }`}
          >
            Leaderboard
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('players')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'players' ? 'text-amber-400 font-semibold' : 'hover:text-white'
            }`}
          >
            Players
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'history' ? 'text-amber-400 font-semibold' : 'hover:text-white'
            }`}
          >
            History
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            className={`transition-colors whitespace-nowrap shrink-0 ${
              activeTab === 'rules' ? 'text-amber-400 font-semibold' : 'hover:text-white'
            }`}
          >
            Rules Guide
          </button>
        </nav>

        {/* Zone 3: Primary Action & Audio */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleToggleSound}
            aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 active:scale-95 transition-all"
            title={isMuted ? 'Sound muted' : 'Tactile sounds active'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-emerald-400" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            aria-label="How to play / Point guide"
            className="md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 active:scale-95 transition-all"
            title="Card rules & points"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onNewGameClick}
            className="touch-btn min-h-[40px] px-3.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 rounded-xl shadow-md shadow-emerald-950/60 active:scale-98 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Match</span>
          </button>
        </div>
      </div>
    </header>
  );
};
