import React, { useState, useEffect } from 'react';
import { GameMatch, Player, PlayerStats } from './types';
import { storage } from './utils/storage';
import { TopNav } from './components/TopNav';
import { BottomTabBar } from './components/BottomTabBar';
import { ActiveGameView } from './components/ActiveGame/ActiveGameView';
import { GameSetupModal } from './components/ActiveGame/GameSetupModal';
import { SavedDraftsList } from './components/ActiveGame/SavedDraftsList';
import { StorageInfoModal } from './components/Common/StorageInfoModal';
import { PlayerManager } from './components/Players/PlayerManager';
import { FamilyLeaderboard } from './components/Leaderboard/FamilyLeaderboard';
import { MatchHistory } from './components/History/MatchHistory';
import { GameRulesView } from './components/Rules/GameRulesView';
import { PlusCircle, Trophy, Sparkles, Dices, Users, BookOpen, Database, Bookmark, Cloud, Share2, Check } from 'lucide-react';
import fourieFamilyLogo from './assets/images/fourie_family_logo.jpeg';
import {
  initializeCloudSync,
  subscribeToFamilyPlayers,
  subscribeToFamilyMatches,
  subscribeToFamilyDrafts,
  savePlayerToCloud,
  deletePlayerFromCloud,
  saveMatchToCloud,
  deleteMatchFromCloud,
  saveDraftToCloud,
  deleteDraftFromCloud,
  subscribeSyncStatus,
  CloudSyncStatus,
} from './utils/firestoreSync';

export default function App() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [stats, setStats] = useState<Record<string, PlayerStats>>({});
  const [matches, setMatches] = useState<GameMatch[]>([]);
  const [drafts, setDrafts] = useState<GameMatch[]>([]);
  const [activeMatch, setActiveMatch] = useState<GameMatch | null>(null);

  const [activeTab, setActiveTab] = useState<string>('game');
  const [showSetupModal, setShowSetupModal] = useState<boolean>(false);
  const [showStorageInfo, setShowStorageInfo] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>({
    isConnected: true,
    isSyncing: false,
    familyId: 'fourie-family',
    lastSyncedAt: Date.now(),
    currentUser: null,
    error: null,
  });

  // Load persistent state from localStorage first for instant rendering
  const refreshFromStorage = () => {
    const curPlayers = storage.getPlayers();
    const curMatches = storage.getMatchHistory();
    setPlayers(curPlayers);
    setMatches(curMatches);
    setStats(storage.getStats());
    setDrafts(storage.getDrafts());
    setActiveMatch(storage.getActiveMatch());
  };

  useEffect(() => {
    // 1. Instant local render
    refreshFromStorage();

    // 2. Track connection status
    const unsubStatus = subscribeSyncStatus((s) => setSyncStatus(s));

    // 3. Boot Cloud Sync
    initializeCloudSync();

    // 4. Listen to real-time Cloud updates from all family devices
    const unsubPlayers = subscribeToFamilyPlayers('fourie-family', (cloudPlayers) => {
      setPlayers(cloudPlayers);
      setStats((prevStats) => {
        const recomputed = storage.recomputeStatsFromMatches(storage.getMatchHistory(), cloudPlayers);
        return { ...prevStats, ...recomputed };
      });
    });

    const unsubMatches = subscribeToFamilyMatches('fourie-family', (cloudMatches) => {
      setMatches(cloudMatches);
      setPlayers((currentPlayers) => {
        const recomputed = storage.recomputeStatsFromMatches(cloudMatches, currentPlayers);
        setStats(recomputed);
        return currentPlayers;
      });
    });

    const unsubDrafts = subscribeToFamilyDrafts('fourie-family', (cloudDrafts) => {
      setDrafts(cloudDrafts);
    });

    return () => {
      unsubStatus();
      unsubPlayers();
      unsubMatches();
      unsubDrafts();
    };
  }, []);

  const handleShareApp = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    } catch {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  // Save active match state whenever it updates (instant local + background cloud sync)
  const handleUpdateMatch = (updated: GameMatch) => {
    setActiveMatch(updated);
    storage.saveActiveMatch(updated);
    storage.saveDraft(updated);
    setDrafts(storage.getDrafts());
    saveDraftToCloud(updated);
  };

  // Complete match: saves to history & updates lifetime stats on all family devices
  const handleFinishMatch = (completedMatch: GameMatch) => {
    storage.completeMatch(completedMatch);
    refreshFromStorage();
    saveMatchToCloud(completedMatch);
  };

  const handleStartGame = (newMatch: GameMatch) => {
    setActiveMatch(newMatch);
    storage.saveDraft(newMatch);
    refreshFromStorage();
    saveDraftToCloud(newMatch);
    setActiveTab('game');
  };

  // Save draft and pause/exit to table
  const handleSaveDraftAndExit = () => {
    if (activeMatch) {
      storage.pauseAndSaveDraft(activeMatch);
      saveDraftToCloud(activeMatch);
      setActiveMatch(null);
      refreshFromStorage();
      setActiveTab('game');
    }
  };

  // Abandon active match without affecting stats
  const handleAbandonMatch = () => {
    if (activeMatch) {
      deleteDraftFromCloud(activeMatch.id);
      storage.abandonActiveMatch();
      setActiveMatch(null);
      refreshFromStorage();
    }
  };

  // Resume a saved draft
  const handleResumeDraft = (draft: GameMatch) => {
    setActiveMatch(draft);
    storage.saveActiveMatch(draft);
    setActiveTab('game');
  };

  // Delete draft
  const handleDeleteDraft = (draftId: string) => {
    deleteDraftFromCloud(draftId);
    storage.deleteDraft(draftId);
    refreshFromStorage();
  };

  // Player CRUD with Cloud Sync
  const handleAddPlayer = (name: string, nickname: string, avatar: string, color: string) => {
    const newPlayer = storage.addPlayer(name, nickname, avatar, color);
    refreshFromStorage();
    savePlayerToCloud(newPlayer);
  };

  const handleUpdatePlayer = (updated: Player) => {
    storage.updatePlayer(updated);
    refreshFromStorage();
    savePlayerToCloud(updated);
  };

  const handleDeletePlayer = (playerId: string) => {
    storage.deletePlayer(playerId);
    refreshFromStorage();
    deletePlayerFromCloud(playerId);
  };

  return (
    <div className="min-h-screen bg-[#071322] text-slate-100 flex flex-col font-sans selection:bg-amber-400 selection:text-slate-950">
      {/* Top App Bar */}
      <TopNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onNewGameClick={() => setShowSetupModal(true)}
        hasActiveGame={activeMatch !== null}
        onShowStorageInfo={() => setShowStorageInfo(true)}
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
                draftsCount={drafts.length}
                onUpdateMatch={handleUpdateMatch}
                onFinishMatch={handleFinishMatch}
                onNewGameRequest={() => setShowSetupModal(true)}
                onNavigateTab={setActiveTab}
                onSaveDraftAndExit={handleSaveDraftAndExit}
                onAbandonMatch={handleAbandonMatch}
                onShowStorageInfo={() => setShowStorageInfo(true)}
              />
            ) : (
              /* No Active Game on Table: Welcome & Saved Drafts Hub */
              <div className="px-4 py-8 max-w-3xl mx-auto space-y-6 pb-28">
                {/* Fourie Family Crest Feature Hero Card */}
                <div className="relative rounded-3xl overflow-hidden border-2 border-[#1c3a64] bg-gradient-to-b from-[#0d223d] via-[#091a2f] to-[#071322] p-6 sm:p-8 shadow-2xl text-center space-y-5">
                  <div className="relative z-10 flex flex-col items-center">
                    {/* Grand Crest Feature */}
                    <div className="relative group mb-3">
                      <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-3xl overflow-hidden border-3 border-amber-400/90 shadow-[0_0_35px_rgba(217,155,38,0.35)] bg-[#071322] p-1.5 transition-transform group-hover:scale-102">
                        <img
                          src={fourieFamilyLogo}
                          alt="Fourie Family Crest"
                          className="w-full h-full object-cover rounded-2xl"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>

                    <h1 className="font-display text-3xl sm:text-4xl font-black text-white tracking-tight mt-1">
                      FOURIE FAMILY
                    </h1>
                    <p className="text-xs sm:text-sm font-bold text-amber-400 tracking-wider uppercase">
                      Cards 4 Life · Official Scorekeeper
                    </p>
                    <p className="text-xs sm:text-sm text-blue-100/90 max-w-md mx-auto mt-1 leading-relaxed">
                      Family card game scorekeeper featuring American Joker 5-round scoring, rapid hold steppers, lifetime statistics, and the Fourie family leaderboard.
                    </p>

                    <div className="pt-4 flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                      <button
                        type="button"
                        onClick={() => setShowSetupModal(true)}
                        className="touch-btn w-full sm:w-auto min-h-[48px] px-7 py-3 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-500 border border-blue-400/50 text-white font-extrabold text-sm rounded-xl shadow-xl shadow-blue-950 flex items-center justify-center gap-2 active:scale-98 transition-all"
                      >
                        <PlusCircle className="w-5 h-5 text-amber-300" />
                        <span>Start New Match</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveTab('rules')}
                        className="touch-btn w-full sm:w-auto min-h-[48px] px-5 py-3 bg-[#0d223d] hover:bg-[#143154] border border-[#1e3e6b] text-blue-100 font-semibold text-sm rounded-xl flex items-center justify-center gap-2 transition-colors"
                      >
                        <BookOpen className="w-4 h-4 text-amber-400" />
                        <span>Rules & Points Guide</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* In-Progress Saved Drafts Section */}
                {drafts.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Bookmark className="w-5 h-5 text-amber-400 fill-amber-400" />
                        <h2 className="font-display font-black text-xl text-white">
                          Saved Match Drafts
                        </h2>
                        <span className="text-xs font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                          {drafts.length}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowStorageInfo(true)}
                        className="text-xs font-semibold text-blue-300 hover:text-amber-300 flex items-center gap-1 transition-colors"
                      >
                        <Database className="w-3.5 h-3.5 text-amber-400" />
                        <span>Where is data saved?</span>
                      </button>
                    </div>

                    <p className="text-xs text-blue-200/80">
                      Your paused matches are safely stored in your browser storage. Tap &ldquo;Resume Match&rdquo; to pick up right where you left off.
                    </p>

                    <SavedDraftsList
                      drafts={drafts}
                      players={players}
                      onResumeDraft={handleResumeDraft}
                      onDeleteDraft={handleDeleteDraft}
                      onStartNewGame={() => setShowSetupModal(true)}
                    />
                  </div>
                )}

                {/* Multi-Device Family Cloud Sync Banner */}
                <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-[#0d223d] via-[#091a2f] to-[#0d223d] border-2 border-amber-400/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
                  <div className="flex items-center gap-3.5">
                    <div className="relative w-12 h-12 rounded-2xl bg-[#071322] border-2 border-amber-400/80 flex items-center justify-center shrink-0 shadow-[0_0_15px_rgba(217,155,38,0.25)]">
                      <Cloud className="w-6 h-6 text-amber-400" />
                      <span className="absolute -top-1 -right-1 flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-400"></span>
                      </span>
                    </div>
                    <div className="text-left space-y-0.5">
                      <div className="flex items-center gap-2">
                        <p className="text-xs sm:text-sm font-extrabold text-white">
                          Family Multi-Device Cloud Sync
                        </p>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-300 bg-[#071322] border border-amber-400/40 px-2 py-0.5 rounded-full">
                          Connected
                        </span>
                      </div>
                      <p className="text-[11px] sm:text-xs text-blue-200/90 leading-snug">
                        Everyone in the family can open this app on their phone, view live games, and record scores together.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto shrink-0 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleShareApp}
                      className="touch-btn flex-1 sm:flex-initial px-4 py-2 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-500 border border-blue-400/50 text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                    >
                      {copiedLink ? (
                        <>
                          <Check className="w-4 h-4 text-amber-300" />
                          <span className="text-amber-300">Link Copied!</span>
                        </>
                      ) : (
                        <>
                          <Share2 className="w-4 h-4 text-amber-300" />
                          <span>Invite Family</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setShowStorageInfo(true)}
                      className="touch-btn px-3 py-2 bg-[#122844] hover:bg-[#1a385f] border border-blue-500/40 text-blue-100 hover:text-white text-xs font-semibold rounded-xl transition-colors shrink-0"
                    >
                      Details
                    </button>
                  </div>
                </div>

                {/* Quick Game Modes Preview Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* American Joker Mode Highlight */}
                  <div
                    onClick={() => setShowSetupModal(true)}
                    className="p-5 rounded-2xl bg-[#0c1e33] border border-[#1b385e] hover:border-amber-400/60 cursor-pointer transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🃏</span>
                      <span className="text-[10px] font-bold text-amber-300 bg-amber-950/70 border border-amber-500/40 px-2 py-0.5 rounded">
                        5 Rounds
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-base text-white group-hover:text-amber-300 transition-colors">
                      American Joker Mode
                    </h3>
                    <p className="text-xs text-blue-200/80 leading-relaxed">
                      3 to 7 cards dealt across 5 rounds. First to go out gets preserved 0 points! Others take penalty card points.
                    </p>
                  </div>

                  {/* Standard Total Points */}
                  <div
                    onClick={() => setShowSetupModal(true)}
                    className="p-5 rounded-2xl bg-[#0c1e33] border border-[#1b385e] hover:border-blue-400/60 cursor-pointer transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-2xl">🎯</span>
                      <span className="text-[10px] font-bold text-blue-300 bg-blue-950/70 border border-blue-500/40 px-2 py-0.5 rounded">
                        Custom Rounds
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-base text-white group-hover:text-blue-300 transition-colors">
                      Standard Total Points
                    </h3>
                    <p className="text-xs text-blue-200/80 leading-relaxed">
                      Flexible round count or target score. Supports positive & negative scores for Golf, Rummy, Spades, and Hearts.
                    </p>
                  </div>
                </div>

                {/* Family Roster Quick Peek */}
                <div className="bg-[#0c1e33]/90 border border-[#1b385e] rounded-2xl p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {players.slice(0, 4).map((p) => (
                        <div
                          key={p.id}
                          className="w-8 h-8 rounded-full bg-[#122844] border-2 border-[#0c1e33] flex items-center justify-center text-sm"
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
                      <p className="text-[11px] text-blue-200/80">
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
            drafts={drafts}
            onResumeDraft={(draft) => {
              handleResumeDraft(draft);
              setActiveTab('game');
            }}
            onDeleteDraft={handleDeleteDraft}
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

      {/* Storage Information Modal */}
      <StorageInfoModal
        isOpen={showStorageInfo}
        onClose={() => setShowStorageInfo(false)}
        onNavigateLeaderboard={() => {
          setShowStorageInfo(false);
          setActiveTab('leaderboard');
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
