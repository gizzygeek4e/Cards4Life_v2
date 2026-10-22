import React, { useState, useMemo } from 'react';
import {
  Trophy,
  Award,
  Flame,
  Download,
  Upload,
  RotateCcw,
  Check,
  Copy,
  Swords,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Zap,
  Target,
  Crown,
  Play,
  ShieldAlert,
} from 'lucide-react';
import { Player, PlayerStats } from '../../types';
import { storage } from '../../utils/storage';
import fourieFamilyLogo from '../../assets/images/fourie_family_logo.jpeg';

interface FamilyLeaderboardProps {
  players: Player[];
  stats: Record<string, PlayerStats>;
  onRefreshData: () => void;
  onStartMatchWithPlayers?: (playerIds: string[]) => void;
}

type SortField = 'WINS' | 'WIN_RATE' | 'ZERO_ROUNDS' | 'AVG_SCORE' | 'STREAK';

export const FamilyLeaderboard: React.FC<FamilyLeaderboardProps> = ({
  players,
  stats,
  onRefreshData,
  onStartMatchWithPlayers,
}) => {
  const [sortField, setSortField] = useState<SortField>('WINS');
  const [showBackupModal, setShowBackupModal] = useState<boolean>(false);
  const [exportJson, setExportJson] = useState<string>('');
  const [importJson, setImportJson] = useState<string>('');
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [expandedPlayerId, setExpandedPlayerId] = useState<string | null>(null);

  // Rivalry Arena State
  const [rivalAId, setRivalAId] = useState<string>(players[0]?.id || '');
  const [rivalBId, setRivalBId] = useState<string>(players[1]?.id || (players[0]?.id || ''));

  // Compute stats for all players
  const playerRankings = useMemo(() => {
    return players.map((p) => {
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
  }, [players, stats]);

  // Sort based on selected sort field
  const sortedRankings = useMemo(() => {
    const list = [...playerRankings];
    list.sort((a, b) => {
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
        // Lower is better in American Joker / Golf
        if (a.stats.gamesPlayed === 0) return 1;
        if (b.stats.gamesPlayed === 0) return -1;
        return a.avgScore - b.avgScore;
      }
      if (sortField === 'STREAK') {
        return b.stats.bestStreak - a.stats.bestStreak;
      }
      return 0;
    });
    return list;
  }, [playerRankings, sortField]);

  // Hall of Fame Accolades Leaders
  const records = useMemo(() => {
    if (players.length === 0) return null;

    let mostWins = playerRankings[0];
    let mostZeroRounds = playerRankings[0];
    let bestStreak = playerRankings[0];
    let bestAvg = playerRankings.filter((p) => p.stats.gamesPlayed > 0)[0] || playerRankings[0];

    playerRankings.forEach((item) => {
      if (item.stats.gamesWon > mostWins.stats.gamesWon) mostWins = item;
      if (item.stats.zeroPointRoundsCount > mostZeroRounds.stats.zeroPointRoundsCount) mostZeroRounds = item;
      if (item.stats.bestStreak > bestStreak.stats.bestStreak) bestStreak = item;
      if (item.stats.gamesPlayed > 0 && item.avgScore < bestAvg.avgScore) bestAvg = item;
    });

    return { mostWins, mostZeroRounds, bestStreak, bestAvg };
  }, [playerRankings, players]);

  // Top 3 for Podium
  const top1 = sortedRankings[0];
  const top2 = sortedRankings[1];
  const top3 = sortedRankings[2];

  // Rivalry Arena comparisons
  const rivalA = playerRankings.find((p) => p.player.id === rivalAId) || playerRankings[0];
  const rivalB = playerRankings.find((p) => p.player.id === rivalBId) || playerRankings[1];

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
    <div className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-8 animate-in fade-in duration-300">
      {/* 1. Grand Heraldic Header Banner */}
      <div className="relative rounded-3xl p-5 sm:p-7 overflow-hidden border border-amber-500/40 dark:border-amber-400/30 bg-gradient-to-br from-amber-50 via-white to-amber-50/40 dark:from-[#0d223d] dark:via-[#091a2f] dark:to-[#071322] shadow-xl dark:shadow-2xl">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
          <div className="flex items-center gap-4">
            <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-amber-500/80 dark:border-amber-400/90 shadow-[0_0_20px_rgba(217,155,38,0.3)] shrink-0 bg-white dark:bg-[#071322] p-1">
              <img
                src={fourieFamilyLogo}
                alt="Fourie Family Crest"
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-heraldic text-xs font-extrabold uppercase tracking-widest text-amber-600 dark:text-amber-400">
                  FOURIE FAMILY HERITAGE
                </span>
                <span className="text-[11px] font-bold text-slate-700 dark:text-blue-300">
                  · {players.length} Competitors
                </span>
              </div>
              <h1 className="font-heraldic text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2 mt-0.5">
                Hall of Fame & Rankings
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-blue-200/80 mt-1">
                Official career leaderboards, zero-score masteries, and lifetime family rivalry honors.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={handleOpenBackup}
              className="touch-btn min-h-[42px] px-3.5 py-2 bg-white hover:bg-slate-50 dark:bg-[#0e2444] dark:hover:bg-[#15345e] border border-slate-300 dark:border-blue-500/40 text-slate-700 dark:text-blue-100 text-xs font-bold rounded-xl shadow-sm dark:shadow-md flex items-center gap-1.5 transition-all active:scale-95"
            >
              <Download className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>Backup / Restore</span>
            </button>

            <button
              type="button"
              onClick={handleResetData}
              className="touch-btn min-h-[42px] min-w-[42px] flex items-center justify-center rounded-xl bg-white hover:bg-rose-50 dark:bg-[#0c1c30] dark:hover:bg-rose-950/40 border border-slate-300 dark:border-[#1b385e] text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 transition-colors shadow-sm"
              title="Reset All Data"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* 2. Interactive Olympic/Royal Champions Podium (Top 3) */}
      {top1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-heraldic text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <span>The Champions Podium</span>
            </h2>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              Ranked by {sortField === 'WINS' ? 'Total Victories' : sortField === 'WIN_RATE' ? 'Win Rate %' : sortField === 'ZERO_ROUNDS' ? '0-Pt Rounds' : 'Avg Score'}
            </span>
          </div>

          <div className="rounded-3xl p-5 sm:p-7 border border-slate-200 dark:border-[#1b385e] bg-gradient-to-b from-white via-slate-50/50 to-amber-50/20 dark:from-[#0a1a2e] dark:via-[#071322] dark:to-[#050e18] shadow-lg dark:shadow-2xl">
            <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-xl mx-auto pt-6 pb-2">
              {/* 2nd Place: Silver Laurel */}
              {top2 ? (
                <div className="flex flex-col items-center text-center group cursor-pointer" onClick={() => setExpandedPlayerId(top2.player.id)}>
                  <div className="relative mb-2">
                    <div
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl border-2 border-slate-300 dark:border-slate-400 shadow-md bg-slate-100 dark:bg-slate-800 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: `${top2.player.color}25` }}
                    >
                      {top2.player.avatar}
                    </div>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-slate-300 dark:bg-slate-200 text-slate-900 font-extrabold text-xs flex items-center justify-center shadow-md">
                      2
                    </div>
                  </div>
                  <span className="font-display font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[90px] sm:max-w-[120px]">
                    {top2.player.name}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {top2.stats.gamesWon} Wins · {top2.winRate}%
                  </span>

                  {/* 2nd Place Pedestal Step */}
                  <div className="w-full h-24 sm:h-28 mt-3 rounded-t-2xl bg-gradient-to-b from-slate-200 to-slate-300 dark:from-slate-700 dark:to-slate-800 flex flex-col items-center justify-center border-t-2 border-slate-300 dark:border-slate-500 shadow-inner">
                    <span className="font-heraldic font-black text-xl text-slate-600 dark:text-slate-300">2ND</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500 dark:text-slate-400">SILVER</span>
                  </div>
                </div>
              ) : <div />}

              {/* 1st Place: Gold Crown & Laurel */}
              <div className="flex flex-col items-center text-center -mt-6 group cursor-pointer" onClick={() => setExpandedPlayerId(top1.player.id)}>
                <div className="relative mb-2">
                  <Crown className="w-8 h-8 text-amber-500 dark:text-amber-400 mx-auto mb-1 animate-bounce duration-1000" />
                  <div
                    className="w-18 h-18 sm:w-22 sm:h-22 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl border-3 border-amber-500 dark:border-amber-400 shadow-[0_0_25px_rgba(217,155,38,0.4)] bg-amber-50 dark:bg-[#0c2340] transition-transform group-hover:scale-105"
                    style={{ backgroundColor: `${top1.player.color}35` }}
                  >
                    {top1.player.avatar}
                  </div>
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-slate-950 font-black text-sm flex items-center justify-center shadow-lg border border-amber-300">
                    1
                  </div>
                </div>
                <span className="font-display font-extrabold text-sm sm:text-base text-slate-900 dark:text-white truncate max-w-[100px] sm:max-w-[140px]">
                  {top1.player.name}
                </span>
                <span className="text-xs font-bold text-amber-600 dark:text-amber-400">
                  {top1.stats.gamesWon} Wins · {top1.winRate}%
                </span>

                {/* 1st Place Pedestal Step */}
                <div className="w-full h-32 sm:h-36 mt-3 rounded-t-2xl bg-gradient-to-b from-amber-300 via-amber-400 to-amber-500 dark:from-amber-600/80 dark:via-amber-700/80 dark:to-amber-900/90 flex flex-col items-center justify-center border-t-3 border-amber-300 dark:border-amber-400 shadow-[0_0_30px_rgba(217,155,38,0.25)] text-slate-950 dark:text-amber-100">
                  <span className="font-heraldic font-black text-2xl tracking-wider">CHAMPION</span>
                  <span className="text-[10px] uppercase font-extrabold tracking-widest text-amber-950 dark:text-amber-200">GOLD CROWN</span>
                  {top1.stats.currentStreak >= 2 && (
                    <span className="mt-1 text-[10px] font-black bg-slate-950/20 px-2 py-0.5 rounded-full flex items-center gap-0.5">
                      <Flame className="w-3 h-3 text-amber-900 dark:text-amber-300 fill-current" />
                      {top1.stats.currentStreak} Win Streak
                    </span>
                  )}
                </div>
              </div>

              {/* 3rd Place: Bronze Laurel */}
              {top3 ? (
                <div className="flex flex-col items-center text-center group cursor-pointer" onClick={() => setExpandedPlayerId(top3.player.id)}>
                  <div className="relative mb-2">
                    <div
                      className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-2xl sm:text-3xl border-2 border-amber-700/80 dark:border-amber-600 shadow-md bg-amber-50/50 dark:bg-amber-950/40 transition-transform group-hover:scale-105"
                      style={{ backgroundColor: `${top3.player.color}25` }}
                    >
                      {top3.player.avatar}
                    </div>
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-amber-700 text-white font-extrabold text-xs flex items-center justify-center shadow-md">
                      3
                    </div>
                  </div>
                  <span className="font-display font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate max-w-[90px] sm:max-w-[120px]">
                    {top3.player.name}
                  </span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                    {top3.stats.gamesWon} Wins · {top3.winRate}%
                  </span>

                  {/* 3rd Place Pedestal Step */}
                  <div className="w-full h-18 sm:h-22 mt-3 rounded-t-2xl bg-gradient-to-b from-amber-700 to-amber-900 dark:from-amber-900 dark:to-slate-950 flex flex-col items-center justify-center border-t-2 border-amber-600 shadow-inner text-amber-100">
                    <span className="font-heraldic font-black text-xl">3RD</span>
                    <span className="text-[10px] uppercase font-bold text-amber-300">BRONZE</span>
                  </div>
                </div>
              ) : <div />}
            </div>
          </div>
        </div>
      )}

      {/* 3. Family Records & Prestige Accolades */}
      {records && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h2 className="font-heraldic text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Award className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <span>All-Time Family Records</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* Record 1: Most Wins */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1c30] border border-slate-200 dark:border-[#1b385e] hover:border-amber-400/50 shadow-sm transition-all space-y-1">
              <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-bold">
                <span>MOST WINS</span>
                <Trophy className="w-4 h-4" />
              </div>
              <div className="font-display text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {records.mostWins.stats.gamesWon}
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-blue-200 truncate flex items-center gap-1">
                <span>{records.mostWins.player.avatar}</span>
                <span>{records.mostWins.player.name}</span>
              </p>
            </div>

            {/* Record 2: 0-Pt Master */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1c30] border border-slate-200 dark:border-[#1b385e] hover:border-blue-400/50 shadow-sm transition-all space-y-1">
              <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-bold">
                <span>0-PT ROUNDS</span>
                <Zap className="w-4 h-4" />
              </div>
              <div className="font-display text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {records.mostZeroRounds.stats.zeroPointRoundsCount}
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-blue-200 truncate flex items-center gap-1">
                <span>{records.mostZeroRounds.player.avatar}</span>
                <span>{records.mostZeroRounds.player.name}</span>
              </p>
            </div>

            {/* Record 3: Best Streak */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1c30] border border-slate-200 dark:border-[#1b385e] hover:border-amber-400/50 shadow-sm transition-all space-y-1">
              <div className="flex items-center justify-between text-xs text-amber-600 dark:text-amber-400 font-bold">
                <span>BEST STREAK</span>
                <Flame className="w-4 h-4 fill-amber-500" />
              </div>
              <div className="font-display text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {records.bestStreak.stats.bestStreak}
                <span className="text-xs font-normal text-slate-500"> in a row</span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-blue-200 truncate flex items-center gap-1">
                <span>{records.bestStreak.player.avatar}</span>
                <span>{records.bestStreak.player.name}</span>
              </p>
            </div>

            {/* Record 4: Lowest Avg Score */}
            <div className="p-4 rounded-2xl bg-white dark:bg-[#0c1c30] border border-slate-200 dark:border-[#1b385e] hover:border-blue-400/50 shadow-sm transition-all space-y-1">
              <div className="flex items-center justify-between text-xs text-blue-600 dark:text-blue-400 font-bold">
                <span>LOWEST AVG</span>
                <Target className="w-4 h-4" />
              </div>
              <div className="font-display text-2xl font-black text-slate-900 dark:text-white tabular-nums">
                {records.bestAvg.avgScore}
                <span className="text-xs font-normal text-slate-500"> pts</span>
              </div>
              <p className="text-xs font-semibold text-slate-700 dark:text-blue-200 truncate flex items-center gap-1">
                <span>{records.bestAvg.player.avatar}</span>
                <span>{records.bestAvg.player.name}</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Family Rivalry Arena (Head-to-Head Comparison) */}
      {players.length >= 2 && rivalA && rivalB && (
        <div className="rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-[#1b385e] bg-white dark:bg-[#0a1a2e] shadow-lg dark:shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1b385e] pb-3">
            <div className="flex items-center gap-2">
              <Swords className="w-5 h-5 text-amber-500 dark:text-amber-400" />
              <h2 className="font-heraldic text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                Family Rivalry Arena
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">Head-to-Head Breakdown</span>
          </div>

          {/* Selectors */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Fighter 1
              </label>
              <select
                value={rivalAId}
                onChange={(e) => setRivalAId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0c1c30] border border-slate-300 dark:border-[#1b385e] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.avatar} {p.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Fighter 2
              </label>
              <select
                value={rivalBId}
                onChange={(e) => setRivalBId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0c1c30] border border-slate-300 dark:border-[#1b385e] text-xs font-bold text-slate-900 dark:text-white focus:outline-none focus:border-amber-400"
              >
                {players.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.avatar} {p.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Head-to-Head Comparison Bars */}
          <div className="space-y-3 pt-2">
            {/* Wins Comparison */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className={rivalA.stats.gamesWon > rivalB.stats.gamesWon ? 'text-amber-500 dark:text-amber-400 font-extrabold' : 'text-slate-600 dark:text-slate-400'}>
                  {rivalA.player.name}: {rivalA.stats.gamesWon} Wins
                </span>
                <span className="text-[10px] text-slate-400 uppercase">Victories</span>
                <span className={rivalB.stats.gamesWon > rivalA.stats.gamesWon ? 'text-amber-500 dark:text-amber-400 font-extrabold' : 'text-slate-600 dark:text-slate-400'}>
                  {rivalB.player.name}: {rivalB.stats.gamesWon} Wins
                </span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 dark:bg-[#0c1c30] overflow-hidden flex border border-slate-200 dark:border-[#1b385e]">
                <div
                  className="bg-amber-400 h-full transition-all"
                  style={{
                    width: `${
                      rivalA.stats.gamesWon + rivalB.stats.gamesWon === 0
                        ? 50
                        : (rivalA.stats.gamesWon / (rivalA.stats.gamesWon + rivalB.stats.gamesWon)) * 100
                    }%`,
                  }}
                />
                <div
                  className="bg-blue-500 h-full transition-all"
                  style={{
                    width: `${
                      rivalA.stats.gamesWon + rivalB.stats.gamesWon === 0
                        ? 50
                        : (rivalB.stats.gamesWon / (rivalA.stats.gamesWon + rivalB.stats.gamesWon)) * 100
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Win Rate % Comparison */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className={rivalA.winRate > rivalB.winRate ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-slate-600 dark:text-slate-400'}>
                  {rivalA.winRate}% Win Rate
                </span>
                <span className="text-[10px] text-slate-400 uppercase">Efficiency</span>
                <span className={rivalB.winRate > rivalA.winRate ? 'text-blue-600 dark:text-blue-400 font-extrabold' : 'text-slate-600 dark:text-slate-400'}>
                  {rivalB.winRate}% Win Rate
                </span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 dark:bg-[#0c1c30] overflow-hidden flex border border-slate-200 dark:border-[#1b385e]">
                <div
                  className="bg-amber-400 h-full transition-all"
                  style={{
                    width: `${
                      rivalA.winRate + rivalB.winRate === 0
                        ? 50
                        : (rivalA.winRate / (rivalA.winRate + rivalB.winRate)) * 100
                    }%`,
                  }}
                />
                <div
                  className="bg-blue-500 h-full transition-all"
                  style={{
                    width: `${
                      rivalA.winRate + rivalB.winRate === 0
                        ? 50
                        : (rivalB.winRate / (rivalA.winRate + rivalB.winRate)) * 100
                    }%`,
                  }}
                />
              </div>
            </div>

            {/* Zero-Point Preserved Rounds */}
            <div>
              <div className="flex justify-between text-xs font-bold mb-1">
                <span className={rivalA.stats.zeroPointRoundsCount > rivalB.stats.zeroPointRoundsCount ? 'text-amber-500 dark:text-amber-400 font-extrabold' : 'text-slate-600 dark:text-slate-400'}>
                  {rivalA.stats.zeroPointRoundsCount} Zero-Pt Rounds
                </span>
                <span className="text-[10px] text-slate-400 uppercase">Clean Sweeps</span>
                <span className={rivalB.stats.zeroPointRoundsCount > rivalA.stats.zeroPointRoundsCount ? 'text-amber-500 dark:text-amber-400 font-extrabold' : 'text-slate-600 dark:text-slate-400'}>
                  {rivalB.stats.zeroPointRoundsCount} Zero-Pt Rounds
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 5. Sort Filter Segmented Controls */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <h2 className="font-heraldic text-base sm:text-lg font-bold text-slate-900 dark:text-white">
            Full Leaderboard Standings
          </h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">Tap player row to inspect details</span>
        </div>

        <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-x-auto shadow-inner">
          <button
            type="button"
            onClick={() => setSortField('WINS')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 ${
              sortField === 'WINS'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            🏆 Most Victories
          </button>
          <button
            type="button"
            onClick={() => setSortField('WIN_RATE')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 ${
              sortField === 'WIN_RATE'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            👑 Win Rate %
          </button>
          <button
            type="button"
            onClick={() => setSortField('ZERO_ROUNDS')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 ${
              sortField === 'ZERO_ROUNDS'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            🃏 0-Pt Rounds
          </button>
          <button
            type="button"
            onClick={() => setSortField('AVG_SCORE')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 ${
              sortField === 'AVG_SCORE'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            🎯 Lowest Avg Score
          </button>
          <button
            type="button"
            onClick={() => setSortField('STREAK')}
            className={`px-3.5 py-2 text-xs font-bold rounded-xl transition-all whitespace-nowrap shrink-0 ${
              sortField === 'STREAK'
                ? 'bg-amber-400 text-slate-950 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
            }`}
          >
            🔥 Best Streak
          </button>
        </div>

        {/* 6. Expandable High-End Rankings List */}
        <div className="space-y-3">
          {sortedRankings.map((item, idx) => {
            const rank = idx + 1;
            const isGold = rank === 1;
            const isSilver = rank === 2;
            const isBronze = rank === 3;
            const isExpanded = expandedPlayerId === item.player.id;

            return (
              <div
                key={item.player.id}
                className={`rounded-2xl transition-all border overflow-hidden ${
                  isGold
                    ? 'bg-gradient-to-r from-amber-50 via-white to-amber-50/50 dark:from-amber-950/30 dark:via-[#0c1e34] dark:to-[#071322] border-amber-400/80 shadow-md dark:shadow-[0_0_25px_rgba(245,158,11,0.15)]'
                    : isSilver
                    ? 'bg-white dark:bg-[#0a1a2e] border-slate-300 dark:border-slate-700 shadow-sm'
                    : isBronze
                    ? 'bg-white dark:bg-[#0a1a2e] border-amber-800/40 dark:border-amber-900/50 shadow-sm'
                    : 'bg-white dark:bg-[#081729] border-slate-200 dark:border-[#142944] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                {/* Main Row Summary */}
                <div
                  onClick={() => setExpandedPlayerId(isExpanded ? null : item.player.id)}
                  className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer select-none"
                >
                  {/* Left: Rank & Player identity */}
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div
                      className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center font-heraldic font-black text-sm shrink-0 border shadow-sm ${
                        isGold
                          ? 'bg-gradient-to-br from-amber-300 to-amber-500 text-slate-950 border-amber-300'
                          : isSilver
                          ? 'bg-slate-200 dark:bg-slate-300 text-slate-900 border-slate-300'
                          : isBronze
                          ? 'bg-amber-800 text-white border-amber-700'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {rank}
                    </div>

                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0 border"
                      style={{
                        backgroundColor: `${item.player.color}20`,
                        borderColor: `${item.player.color}60`,
                      }}
                    >
                      {item.player.avatar}
                    </div>

                    <div className="truncate">
                      <div className="flex items-center gap-2">
                        <h3 className="font-display font-extrabold text-base sm:text-lg text-slate-900 dark:text-white truncate">
                          {item.player.name}
                        </h3>
                        {isGold && (
                          <span className="text-amber-500 dark:text-amber-400 text-xs font-bold flex items-center gap-0.5">
                            👑 Champion
                          </span>
                        )}
                        {item.stats.currentStreak >= 2 && (
                          <span className="text-[11px] font-bold text-amber-500 dark:text-amber-400 flex items-center gap-0.5">
                            <Flame className="w-3.5 h-3.5 fill-amber-500" /> {item.stats.currentStreak}W Streak
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                        {item.player.nickname || 'Family Member'}
                      </p>
                    </div>
                  </div>

                  {/* Right: Key Stats Metrics (Tabular numerals, zero pill) */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800/80 text-center">
                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-tight block">
                        Victories
                      </span>
                      <span className="font-display text-base sm:text-lg font-black text-amber-600 dark:text-amber-300 tabular-nums">
                        {item.stats.gamesWon}
                        <span className="text-xs text-slate-400 font-normal"> / {item.stats.gamesPlayed}</span>
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-tight block">
                        Win Rate
                      </span>
                      <span className="font-display text-base sm:text-lg font-black text-blue-600 dark:text-blue-300 tabular-nums">
                        {item.winRate}%
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-tight block">
                        0-Pt Rounds
                      </span>
                      <span className="font-display text-base sm:text-lg font-black text-amber-600 dark:text-amber-300 tabular-nums">
                        {item.stats.zeroPointRoundsCount}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-tight block">
                        Avg Score
                      </span>
                      <span className="font-display text-base sm:text-lg font-bold text-slate-700 dark:text-slate-300 tabular-nums">
                        {item.avgScore}
                      </span>
                    </div>

                    <div className="text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors pl-1">
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </div>
                  </div>
                </div>

                {/* Expanded Career Dossier */}
                {isExpanded && (
                  <div className="p-4 sm:p-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-[#071322]/80 space-y-4 animate-in fade-in duration-200">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                      <div className="p-3 rounded-xl bg-white dark:bg-[#0c1c30] border border-slate-200 dark:border-[#1b385e]">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Career Points</span>
                        <span className="font-display text-base font-extrabold text-slate-900 dark:text-white tabular-nums">
                          {item.stats.totalPoints} pts
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-[#0c1c30] border border-slate-200 dark:border-[#1b385e]">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Best Single Round</span>
                        <span className="font-display text-base font-extrabold text-amber-600 dark:text-amber-400 tabular-nums">
                          {item.stats.bestRoundScore} pts
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-[#0c1c30] border border-slate-200 dark:border-[#1b385e]">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">All-Time Best Streak</span>
                        <span className="font-display text-base font-extrabold text-amber-500 dark:text-amber-400 tabular-nums">
                          {item.stats.bestStreak} Games
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-white dark:bg-[#0c1c30] border border-slate-200 dark:border-[#1b385e]">
                        <span className="text-[10px] uppercase font-bold text-slate-400 block">Current Streak</span>
                        <span className="font-display text-base font-extrabold text-blue-600 dark:text-blue-400 tabular-nums">
                          {item.stats.currentStreak} Games
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-1">
                      <span>Roster ID: <code className="font-mono text-[11px] text-slate-600 dark:text-slate-300">{item.player.id}</code></span>
                      {onStartMatchWithPlayers && (
                        <button
                          type="button"
                          onClick={() => onStartMatchWithPlayers([item.player.id])}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                        >
                          <Play className="w-3.5 h-3.5 text-amber-300" />
                          <span>Start Match with {item.player.name}</span>
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 7. Backup & Sync Modal */}
      {showBackupModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#071322] border-2 border-slate-300 dark:border-[#1b3558] rounded-3xl w-full max-w-lg shadow-2xl p-6 space-y-4 my-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-[#1b3558] pb-3">
              <div>
                <h3 className="font-heraldic font-bold text-lg text-slate-900 dark:text-white">Family Data Backup & Sync</h3>
                <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">Export or restore lifetime records between family phones</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBackupModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#0c1c30] text-slate-400 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Export Section */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Export Data JSON
                </span>
                <button
                  type="button"
                  onClick={handleCopyExport}
                  className="text-xs text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 font-bold"
                >
                  {copySuccess ? <Check className="w-3.5 h-3.5 text-amber-500" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copySuccess ? 'Copied!' : 'Copy to Clipboard'}</span>
                </button>
              </div>
              <textarea
                readOnly
                value={exportJson}
                rows={4}
                className="w-full p-2.5 bg-slate-50 dark:bg-[#09182b] border border-slate-300 dark:border-[#1b385e] rounded-xl text-xs font-mono text-slate-800 dark:text-blue-100 focus:outline-none"
              />
            </div>

            {/* Import Section */}
            <div>
              <span className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                Restore from Backup JSON
              </span>
              <textarea
                value={importJson}
                onChange={(e) => setImportJson(e.target.value)}
                placeholder="Paste family backup JSON here..."
                rows={4}
                className="w-full p-2.5 bg-slate-50 dark:bg-[#09182b] border border-slate-300 dark:border-[#1b385e] rounded-xl text-xs font-mono text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowBackupModal(false)}
                className="px-4 py-2 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              >
                Close
              </button>
              <button
                type="button"
                onClick={handleImport}
                disabled={!importJson.trim()}
                className="touch-btn px-5 py-2.5 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-500 border border-blue-400/40 disabled:opacity-40 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition-colors shadow-md"
              >
                <Upload className="w-4 h-4 text-amber-300" />
                <span>Restore Records</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
