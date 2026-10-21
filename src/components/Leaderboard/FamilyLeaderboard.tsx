import React, { useState } from 'react';
import { Trophy, Award, Flame, Download, Upload, RotateCcw, Check, Copy } from 'lucide-react';
import { Player, PlayerStats } from '../../types';
import { storage } from '../../utils/storage';
import fourieFamilyLogo from '../../assets/images/fourie_family_logo.jpeg';

interface FamilyLeaderboardProps {
  players: Player[];
  stats: Record<string, PlayerStats>;
  onRefreshData: () => void;
}

type SortField = 'WINS' | 'WIN_RATE' | 'ZERO_ROUNDS' | 'AVG_SCORE';

export const FamilyLeaderboard: React.FC<FamilyLeaderboardProps> = ({
  players,
  stats,
  onRefreshData,
}) => {
  const [sortField, setSortField] = useState<SortField>('WINS');
  const [showBackupModal, setShowBackupModal] = useState<boolean>(false);
  const [exportJson, setExportJson] = useState<string>('');
  const [importJson, setImportJson] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);

  // Compute stats for all players
  const playerRankings = players.map((p) => {
    const s = stats[p.id] || {
      playerId: p.id,
      gamesPlayed: 0,
      gamesWon: 0,
      totalPoints: 0,
      bestRoundScore: 0,
      zeroPointRoundsCount: 0,
      currentStreak: 0,
      bestStreak: 0,
    };

    const winRate = s.gamesPlayed > 0 ? (s.gamesWon / s.gamesPlayed) * 100 : 0;
    const avgScore = s.gamesPlayed > 0 ? Math.round(s.totalPoints / s.gamesPlayed) : 0;

    return {
      player: p,
      stats: s,
      winRate: Math.round(winRate),
      avgScore,
    };
  });

  // Sort based on selected sort field
  playerRankings.sort((a, b) => {
    if (sortField === 'WINS') {
      if (b.stats.gamesWon !== a.stats.gamesWon) {
        return b.stats.gamesWon - a.stats.gamesWon;
      }
      return b.winRate - a.winRate;
    }
    if (sortField === 'WIN_RATE') {
      if (b.winRate !== a.winRate) {
        return b.winRate - a.winRate;
      }
      return b.stats.gamesWon - a.stats.gamesWon;
    }
    if (sortField === 'ZERO_ROUNDS') {
      return b.stats.zeroPointRoundsCount - a.stats.zeroPointRoundsCount;
    }
    if (sortField === 'AVG_SCORE') {
      // Lower score is better in American Joker / Golf
      return a.avgScore - b.avgScore;
    }
    return 0;
  });

  const handleOpenBackup = () => {
    setExportJson(storage.exportData());
    setImportJson('');
    setCopySuccess(false);
    setShowBackupModal(true);
  };

  const handleCopyExport = () => {
    navigator.clipboard.writeText(exportJson);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleImport = () => {
    if (!importJson.trim()) return;
    const ok = storage.importData(importJson);
    if (ok) {
      alert('Family records restored successfully!');
      setShowBackupModal(false);
      onRefreshData();
    } else {
      alert('Invalid backup JSON format. Please verify and try again.');
    }
  };

  const handleResetData = () => {
    if (window.confirm('Reset family stats and restore starter profiles? This cannot be undone.')) {
      storage.resetAll();
      onRefreshData();
      alert('Database reset to fresh starter family profiles.');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-6">
      {/* Heraldic Fourie Family Crest Banner */}
      <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-[#0d223d] via-[#091a2f] to-[#0d223d] border-2 border-[#1b3558] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-amber-400/90 shadow-[0_0_16px_rgba(217,155,38,0.35)] shrink-0 bg-[#071322] p-0.5">
            <img src={fourieFamilyLogo} alt="Fourie Family Crest" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400 block">
              FOURIE FAMILY HERITAGE
            </span>
            <h1 className="font-display text-xl sm:text-2xl font-black text-white tracking-tight flex items-center gap-2">
              Hall of Fame & Rankings
              <Trophy className="w-5 h-5 text-amber-400" />
            </h1>
            <p className="text-xs text-blue-200/80 mt-0.5">
              Lifetime stats, victory tallies, and zero-score preserved rounds
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleOpenBackup}
            className="touch-btn min-h-[40px] px-3.5 py-1.5 bg-[#0e2444] hover:bg-[#15345e] border border-blue-500/40 text-blue-100 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Backup / Sync</span>
          </button>

          <button
            type="button"
            onClick={handleResetData}
            className="w-10 h-10 flex items-center justify-center rounded-xl bg-[#0c1c30] border border-[#1b385e] text-slate-400 hover:text-rose-400 hover:bg-[#142a45] transition-colors"
            title="Reset All Data"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Sort Filter Tabs (Functional segmented controls) */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-950/80 border border-slate-800 rounded-xl overflow-x-auto">
        <button
          type="button"
          onClick={() => setSortField('WINS')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            sortField === 'WINS'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🏆 Most Victories
        </button>
        <button
          type="button"
          onClick={() => setSortField('WIN_RATE')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            sortField === 'WIN_RATE'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          👑 Win Rate %
        </button>
        <button
          type="button"
          onClick={() => setSortField('ZERO_ROUNDS')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            sortField === 'ZERO_ROUNDS'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🃏 0-Pt Rounds
        </button>
        <button
          type="button"
          onClick={() => setSortField('AVG_SCORE')}
          className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            sortField === 'AVG_SCORE'
              ? 'bg-amber-400 text-slate-950 font-bold shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          🎯 Lowest Avg Score
        </button>
      </div>

      {/* Leaderboard Table / Cards */}
      <div className="space-y-3">
        {playerRankings.map((item, idx) => {
          const rank = idx + 1;
          const isGold = rank === 1;
          const isSilver = rank === 2;
          const isBronze = rank === 3;

          return (
            <div
              key={item.player.id}
              className={`rounded-2xl p-4 transition-all border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                isGold
                  ? 'bg-gradient-to-r from-amber-950/30 via-slate-900 to-slate-900 border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.1)]'
                  : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
              }`}
            >
              {/* Left Slot: Rank & Player identity */}
              <div className="flex items-center gap-3.5 min-w-0">
                {/* Rank Badge */}
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-display font-extrabold text-sm shrink-0 border ${
                    isGold
                      ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/30'
                      : isSilver
                      ? 'bg-slate-300 text-slate-950 border-slate-200'
                      : isBronze
                      ? 'bg-amber-800 text-white border-amber-700'
                      : 'bg-slate-950 text-slate-400 border-slate-800'
                  }`}
                >
                  {rank}
                </div>

                <div
                  className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border"
                  style={{
                    backgroundColor: `${item.player.color}25`,
                    borderColor: `${item.player.color}60`,
                  }}
                >
                  {item.player.avatar}
                </div>

                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-base text-white truncate">
                      {item.player.name}
                    </h3>
                    {isGold && <span className="text-amber-400 text-xs">👑 #1</span>}
                    {item.stats.currentStreak >= 2 && (
                      <span className="text-[10px] font-bold text-amber-400 flex items-center gap-0.5">
                        <Flame className="w-3 h-3 fill-amber-400" /> {item.stats.currentStreak}W
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-400 truncate">{item.player.nickname}</p>
                </div>
              </div>

              {/* Right Slot: Key Stats Metrics (Tabular numerals, zero pill) */}
              <div className="flex items-center justify-between sm:justify-end gap-6 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800 text-center">
                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight block">
                    Victories
                  </span>
                  <span className="font-display text-base font-extrabold text-amber-300 tabular-nums">
                    {item.stats.gamesWon}
                    <span className="text-xs text-slate-400 font-normal"> / {item.stats.gamesPlayed}</span>
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight block">
                    Win Rate
                  </span>
                  <span className="font-display text-base font-extrabold text-blue-300 tabular-nums">
                    {item.winRate}%
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight block" title="Rounds won with 0 points">
                    0-Pt Rounds
                  </span>
                  <span className="font-display text-base font-extrabold text-amber-300 tabular-nums">
                    {item.stats.zeroPointRoundsCount}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-tight block">
                    Avg Score
                  </span>
                  <span className="font-display text-base font-bold text-slate-300 tabular-nums">
                    {item.avgScore}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Backup & Sync Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-[#071322] border-2 border-[#1b3558] rounded-2xl w-full max-w-lg shadow-2xl p-5 space-y-4 my-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-[#1b3558] pb-3">
              <div>
                <h3 className="font-display font-bold text-base text-white">Family Data Backup & Sync</h3>
                <p className="text-xs text-amber-400/90 font-medium">Export or restore lifetime records between family phones</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBackupModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            {/* Export Section */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Export Data JSON
                </span>
                <button
                  type="button"
                  onClick={handleCopyExport}
                  className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                >
                  {copySuccess ? <Check className="w-3.5 h-3.5 text-amber-300" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copySuccess ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={exportJson}
                rows={4}
                className="w-full p-2.5 bg-[#09182b] border border-[#1b385e] rounded-xl text-xs font-mono text-blue-100 focus:outline-none"
              />
            </div>

            {/* Import Section */}
            <div>
              <span className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Restore from Backup JSON
              </span>
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder="Paste family backup JSON here..."
                rows={4}
                className="w-full p-2.5 bg-[#09182b] border border-[#1b385e] rounded-xl text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBackupModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!importJson.trim()}
                className="touch-btn px-4 py-2 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-500 border border-blue-400/40 disabled:opacity-40 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-md shadow-blue-950"
              >
                <Upload className="w-3.5 h-3.5 text-amber-300" />
                <span>Restore Records</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
