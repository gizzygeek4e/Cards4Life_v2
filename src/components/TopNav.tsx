import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, PlusCircle, HelpCircle, Image as ImageIcon, LogOut, Database, Cloud, Share2, Check } from 'lucide-react';
import { soundManager } from '../utils/audio';
import fourieFamilyLogo from '../assets/images/fourie_family_logo.jpeg';
import { initAuth, googleSignIn, googleSignOut } from '../utils/googlePhotos';
import { subscribeSyncStatus, CloudSyncStatus } from '../utils/firestoreSync';
import { User } from 'firebase/auth';

interface TopNavProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewGameClick: () => void;
  hasActiveGame: boolean;
  onShowStorageInfo?: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  activeTab,
  setActiveTab,
  onNewGameClick,
  hasActiveGame,
  onShowStorageInfo,
}) => {
  const [isMuted, setIsMuted] = useState<boolean>(soundManager.getMuted());
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showUserMenu, setShowUserMenu] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>({
    isConnected: true,
    isSyncing: false,
    familyId: 'fourie-family',
    lastSyncedAt: Date.now(),
    currentUser: null,
    error: null,
  });

  useEffect(() => {
    const unsubSync = subscribeSyncStatus((status) => setSyncStatus(status));
    return () => unsubSync();
  }, []);

  const handleShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  useEffect(() => {
    const unsub = initAuth(
      (user) => setCurrentUser(user),
      () => setCurrentUser(null)
    );
    return () => unsub();
  }, []);

  const handleToggleSound = () => {
    const next = soundManager.toggleMute();
    setIsMuted(next);
  };

  return (
    <header className="sticky top-0 z-40 bg-[#071322]/95 backdrop-blur-md border-b border-[#1b3558] pt-safe">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4 md:gap-8">
        {/* Zone 1: Fourie Family Crest & Brand Wordmark */}
        <div
          onClick={() => setActiveTab('game')}
          className="flex items-center gap-2.5 cursor-pointer whitespace-nowrap shrink-0 group"
        >
          <div className="w-9 h-9 rounded-xl overflow-hidden border-2 border-amber-400/90 shadow-[0_0_12px_rgba(217,155,38,0.35)] shrink-0 bg-[#0a1b32]">
            <img
              src={fourieFamilyLogo}
              alt="Fourie Family Crest"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col text-left">
            <span className="font-display font-extrabold text-base sm:text-lg tracking-tight text-white flex items-center gap-1.5 leading-tight">
              FOURIE FAMILY
            </span>
            <span className="text-[10px] font-bold text-amber-400 tracking-wider uppercase flex items-center gap-1">
              <span>Cards 4 Life</span>
              <span className="text-blue-300">·</span>
              <span className="text-blue-300 font-normal">Scorekeeper</span>
            </span>
          </div>
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
        <div className="flex items-center gap-2 shrink-0 relative">
          {/* Google Photos Sync Indicator / Button */}
          {currentUser ? (
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="min-h-[40px] px-2.5 py-1 rounded-xl bg-[#0c1c30] border border-blue-500/50 flex items-center gap-1.5 hover:bg-[#122844] transition-colors"
                title={`Google Photos connected as ${currentUser.displayName || currentUser.email}`}
              >
                {currentUser.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={currentUser.displayName || 'Google User'}
                    className="w-6 h-6 rounded-full object-cover border border-amber-400"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {(currentUser.displayName || currentUser.email || 'G')[0].toUpperCase()}
                  </div>
                )}
                <span className="text-[10px] font-bold text-blue-300 hidden lg:inline">
                  Photos Synced
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 top-12 w-64 p-3 bg-[#0c1c30] border border-[#1b385e] rounded-2xl shadow-2xl z-50 animate-in fade-in zoom-in-95 space-y-2.5">
                  <div className="flex items-center gap-2.5 pb-2 border-b border-[#1b385e]">
                    {currentUser.photoURL && (
                      <img
                        src={currentUser.photoURL}
                        alt="User"
                        className="w-8 h-8 rounded-full border border-amber-400"
                      />
                    )}
                    <div className="truncate text-left">
                      <p className="text-xs font-bold text-white truncate">
                        {currentUser.displayName || 'Google User'}
                      </p>
                      <p className="text-[10px] text-blue-300/80 truncate">{currentUser.email}</p>
                    </div>
                  </div>

                  <div className="text-[11px] text-blue-100 space-y-1">
                    <p className="font-semibold text-amber-300 flex items-center gap-1">
                      <span>✓ Google Photos Connected</span>
                    </p>
                    <p className="text-[10px] text-slate-300">
                      Match celebration photos will be added to album:
                      <strong className="block text-amber-200 mt-0.5">Cards 4 Life - Family Matches</strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={async () => {
                      await googleSignOut();
                      setShowUserMenu(false);
                    }}
                    className="w-full py-1.5 px-2 rounded-lg bg-[#14263d] hover:bg-rose-950/50 text-blue-200 hover:text-rose-300 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Disconnect Google Account</span>
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={async () => {
                try {
                  await googleSignIn();
                } catch (e) {
                  console.error(e);
                }
              }}
              className="min-h-[40px] px-2.5 py-1 rounded-xl bg-[#0c1c30] hover:bg-[#122844] border border-[#1b385e] text-blue-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
              title="Connect Google Photos to sync match pictures"
            >
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span className="hidden sm:inline">Google Photos</span>
            </button>
          )}

          {/* Cloud Sync & Family Storage Indicator */}
          {onShowStorageInfo && (
            <button
              type="button"
              onClick={onShowStorageInfo}
              aria-label="Multi-Device Cloud Sync Status"
              className="min-h-[40px] px-2.5 py-1 flex items-center justify-center gap-1.5 rounded-xl bg-[#0c1c30] border border-[#1b385e] hover:border-amber-400/50 text-blue-200 hover:text-amber-300 active:scale-95 transition-all group"
              title="Family Multi-Device Cloud Sync Active"
            >
              <div className="relative flex items-center justify-center">
                <Cloud className="w-3.5 h-3.5 text-amber-400" />
                <span className="absolute -top-1 -right-1 flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-400"></span>
                </span>
              </div>
              <span className="text-[11px] font-bold text-amber-300/90 hidden lg:inline">Cloud Sync</span>
            </button>
          )}

          {/* Quick Share Link for Family Devices */}
          <button
            type="button"
            onClick={handleShareLink}
            aria-label="Share App with Family"
            className="min-h-[40px] px-2.5 py-1 flex items-center justify-center gap-1 rounded-xl bg-[#0c1c30] border border-[#1b385e] text-blue-200 hover:text-white active:scale-95 transition-all"
            title="Copy app link to send to family members"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-amber-400" />
                <span className="text-[11px] font-bold text-amber-300 hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-blue-300" />
                <span className="text-[11px] font-semibold hidden xl:inline">Share</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleToggleSound}
            aria-label={isMuted ? 'Unmute sounds' : 'Mute sounds'}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-[#0c1c30] border border-[#1b385e] text-blue-300 hover:text-white active:scale-95 transition-all"
            title={isMuted ? 'Sound muted' : 'Tactile sounds active'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rules')}
            aria-label="How to play / Point guide"
            className="md:hidden min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl bg-[#0c1c30] border border-[#1b385e] text-blue-300 hover:text-white active:scale-95 transition-all"
            title="Card rules & points"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onNewGameClick}
            className="touch-btn min-h-[40px] px-3.5 py-1.5 text-xs font-bold text-white bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-500 border border-blue-400/40 rounded-xl shadow-md shadow-blue-950/80 active:scale-98 transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <PlusCircle className="w-4 h-4 text-amber-400" />
            <span>New Match</span>
          </button>
        </div>
      </div>
    </header>
  );
};
