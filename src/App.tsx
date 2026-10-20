import React, { useState, useEffect } from 'react';
import { GameMatch, Player, PlayerStats } from './types';
import { storage } from './utils/storage';
import { TopNav } from './components/TopNav';
import { BottomTabBar } from './components/BottomTabBar';
import { ActiveGameView } from './components/ActiveGame/ActiveGameView';
import { GameSetupModal } from './components/ActiveGame/GameSetupModal';
import { PlayerManager } from './components/Players/PlayerManager';
import { FamilyLeaderboard } from './components/Leaderboard/FamilyLeaderboard';
import { MatchHistory } from './components/History/MatchHistory';
import { GameRulesView } from './components/Rules/GameRulesView';
import { PlusCircle, Trophy, Sparkles, Dices, Users, BookOpen } from 'lucide-react';

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<Record<string, PlayerStats>>({});
  const [matches, setMatches] = useState<GameMatch[]>([]);
  const [activeMatch, setActiveMatch] = useState<GameMatch | null>(null);

  const [activeTab, setActiveTab] = useState<string>('game');
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);

  // Load persistent state from localStorage
  const refreshFromStorage = () => {
    setPlayers(storage.getPlayers());
    setStats(storage.getStats());
    setMatches(storage.getMatchHistory());
    setActiveMatch(storage.getActiveMatch());
  };

  useEffect(() => {
    refreshFromStorage();
  }, []);

  // Save active match state whenever it updates
  const handleUpdateMatch = (updated: GameMatch) => {
    setActiveMatch(updated);
    storage.saveActiveMatch(updated);
  };

  // Complete match: saves to history & updates lifetime stats
  const handleFinishMatch = (completedMatch: GameMatch) => {
    storage.completeMatch(completedMatch);
    refreshFromStorage();
  };

  const handleStartGame = (newMatch: GameMatch) => {
    setActiveMatch(newMatch);
    storage.saveActiveMatch(newMatch);
    setActiveTab('game');
  };

  // Player CRUD
  const handleAddPlayer = (name: string, nickname: string, avatar: string, color: string) => {
    storage.addPlayer(name, nickname, avatar, color);
    refreshFromStorage();
  };

  const handleUpdatePlayer = (updated: Player) => {
    storage.updatePlayer(updated);
    refreshFromStorage();
  };

  const handleDeletePlayer = (playerId: string) => {
    storage.deletePlayer(playerId);
    refreshFromStorage();
  };

  return (
    <div className="min-h-screen bg-[#0b1311] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top App Bar */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewGameClick={() => setShowSetupModal(true)}
        hasActiveGame={activeMatch !== null}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-6xl mx-auto">
        {/* TAB 1: GAME VIEW */}
        {activeTab === 'game' && (
          <>
            {activeMatch ? (
              <ActiveGameView
                match={activeMatch}
                players={players}
                onUpdateMatch={handleUpdateMatch}
                onFinishMatch={handleFinishMatch}
                onNewGameRequest={() => setShowSetupModal(true)}
                onNavigateTab={setActiveTab}
              />
            ) : (
              /* No Active Game: Welcome Card Table */
              <div className="px-4 py-8 max-w-3xl mx-auto space-y-6 pb-28">
                {/* Hero Card */}
                <div className="relative rounded-3xl overflow-hidden border border-emerald-900/60 bg-gradient-to-b from-emerald-950/90 via-slate-900 to-slate-950 p-6 sm:p-8 shadow-2xl text-center space-y-5">
                  <div className="relative z-10 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-amber-400/80 shadow-[0_0_25px_rgba(245,158,11,0.3)] mb-4">
                      <img
                        src="/src/assets/images/cards4life_brand_icon_1792466194467.jpg"
                        alt="Cards 4 Life"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    <h1 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight">
                      Cards 4 Life
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mt-1 leading-relaxed">
                      The premier mobile-first family card game scorekeeper. Featuring American Joker 5-round scoring, rapid hold-to-accelerate point steppers, and lifetime stats.
                    </p>

                    <div className="pt-4 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setShowSetupModal(true)}
                        className="touch-btn w-full sm:w-auto min-h-[48px] px-7 py-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-white font-extrabold text-sm rounded-xl shadow-xl shadow-emerald-950 flex items-center justify-center gap-2 active:scale-98 transition-all"
                      >
                        <PlusCircle className="w-5 h-5" />
                        <span>Start New Match</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('rules')}
                        className="touch-btn w-full sm:w-auto min-h-[48px] px-5 py-3 bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
                      >
                        <BookOpen className="w-4 h-4 text-amber-400" />
                        <span>Rules & Points Guide</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Quick Game Modes Preview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* American Joker Mode Highlight */}
                  <div
                    onClick={() => setShowSetupModal(true)}
                    className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-amber-500/50 cursor-pointer transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🃏</span>
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-2 py-0.5 rounded">
                        5 Rounds
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-base text-white group-hover:text-amber-300 transition-colors">
                      American Joker Mode
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      3 to 7 cards dealt across 5 rounds. First to go out gets preserved 0 points! Others take penalty card points.
                    </p>
                  </div>

                  {/* Standard Total Points */}
                  <div
                    onClick={() => setShowSetupModal(true)}
                    className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 hover:border-sky-500/50 cursor-pointer transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🎯</span>
                      <span className="text-[10px] font-bold text-sky-400 bg-sky-950/60 border border-sky-500/30 px-2 py-0.5 rounded">
                        Custom Rounds
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-base text-white group-hover:text-sky-300 transition-colors">
                      Standard Total Points
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Flexible round count or target score. Supports positive & negative scores for Golf, Rummy, Spades, and Hearts.
                    </p>
                  </div>
                </div>

                {/* Family Roster Quick Peek */}
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {players.slice(0, 4).map((p) => (
                        <div
                          key={p.id}
                          className="w-8 h-8 rounded-full bg-slate-800 border-2 border-slate-900 flex items-center justify-center text-sm"
                          title={p.name}
                        >
                          {p.avatar}
                        </div>
                      ))}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-white">
                        {players.length} Family Profiles Active
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {players.map((p) => p.name).slice(0, 3).join(', ')}
                        {players.length > 3 ? ` +${players.length - 3} more` : ''}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('players')}
                    className="text-xs font-semibold text-amber-400 hover:text-amber-300 transition-colors"
                  >
                    Manage Roster →
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: LEADERBOARD */}
        {activeTab === 'leaderboard' && (
          <FamilyLeaderboard
            players={players}
            stats={stats}
            onRefreshData={refreshFromStorage}
          />
        )}

        {/* TAB 3: PLAYERS */}
        {activeTab === 'players' && (
          <PlayerManager
            players={players}
            stats={stats}
            onAddPlayer={handleAddPlayer}
            onUpdatePlayer={handleUpdatePlayer}
            onDeletePlayer={handleDeletePlayer}
            onStartMatchWithPlayers={() => {
              setShowSetupModal(true);
            }}
          />
        )}

        {/* TAB 4: HISTORY */}
        {activeTab === 'history' && (
          <MatchHistory
            matches={matches}
            players={players}
            onStartNewGame={() => setShowSetupModal(true)}
            onRefreshMatches={refreshFromStorage}
          />
        )}

        {/* TAB 5: RULES */}
        {activeTab === 'rules' && <GameRulesView />}
      </main>

      {/* Setup New Game Modal */}
      <GameSetupModal
        isOpen={showSetupModal}
        onClose={() => setShowSetupModal(false)}
        players={players}
        onStartGame={handleStartGame}
        onManagePlayers={() => {
          setShowSetupModal(false);
          setActiveTab('players');
        }}
      />

      {/* Mobile Fixed Bottom Navigation Bar */}
      <BottomTabBar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasActiveGame={activeMatch !== null}
      />
    </div>
  );
}
