import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Award, RotateCcw, BarChart2, Star } from 'lucide-react';
import { GameMatch, Player } from '../../types';
import { soundManager } from '../../utils/audio';

interface GameVictoryModalProps {
  isOpen: boolean;
  match: GameMatch;
  players: Player[];
  onPlayAgain: () => void;
  onViewLeaderboard: () => void;
  onViewScoreSheet: () => void;
}

export const GameVictoryModal: React.FC<GameVictoryModalProps> = ({
  isOpen,
  match,
  players,
  onPlayAgain,
  onViewLeaderboard,
  onViewScoreSheet,
}) => {
  useEffect(() => {
    if (isOpen) {
      soundManager.playVictoryFanfare();

      // Confetti burst sequence
      const duration = 2.5 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#ffffff'],
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#ffffff'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate totals and rankings
  const totals: Record<string, number> = {};
  const zeroCounts: Record<string, number> = {};
  match.playerIds.forEach((pid) => {
    totals[pid] = 0;
    zeroCounts[pid] = 0;
  });

  match.rounds.forEach((round) => {
    match.playerIds.forEach((pid) => {
      const sc = round.scores[pid];
      if (sc) {
        totals[pid] = (totals[pid] || 0) + sc.score;
        if (sc.score === 0 || sc.isRoundWinner) {
          zeroCounts[pid] = (zeroCounts[pid] || 0) + 1;
        }
      }
    });
  });

  const sortedPlayerIds = [...match.playerIds].sort((a, b) => {
    const scA = totals[a] ?? 0;
    const scB = totals[b] ?? 0;
    return match.winningCondition === 'LOWEST_SCORE' ? scA - scB : scB - scA;
  });

  const getPlayer = (id: string) => players.find((p) => p.id === id);

  const championId = sortedPlayerIds[0];
  const champion = getPlayer(championId);

  // Find most 0-score round player
  let bestZeroPlayerId = championId;
  let maxZeros = 0;
  Object.entries(zeroCounts).forEach(([pid, count]) => {
    if (count > maxZeros) {
      maxZeros = count;
      bestZeroPlayerId = pid;
    }
  });
  const bestZeroPlayer = getPlayer(bestZeroPlayerId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/50 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Banner with card felt art */}
        <div className="relative p-6 text-center border-b border-amber-500/30 overflow-hidden bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900">
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-bounce">
              <Trophy className="w-9 h-9 text-amber-400" />
            </div>

            <p className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
              Match Championship Concluded
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {champion?.name} Takes the Win!
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Finished with{' '}
              <strong className="text-amber-300 font-bold tabular-nums">{totals[championId]} points</strong> across{' '}
              {match.rounds.length} rounds.
            </p>
          </div>
        </div>

        {/* Podium Top 3 */}
        <div className="p-5 space-y-4">
          <div className="flex items-end justify-center gap-2 sm:gap-3 pt-2 pb-1">
            {/* 2nd Place */}
            {sortedPlayerIds[1] && (
              <div className="flex-1 flex flex-col items-center text-center">
                <div className="text-2xl mb-1">{getPlayer(sortedPlayerIds[1])?.avatar}</div>
                <div className="w-full bg-slate-800/80 border border-slate-700 rounded-t-2xl p-2.5 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">2nd Place</span>
                  <p className="text-xs font-bold text-white truncate max-w-full">
                    {getPlayer(sortedPlayerIds[1])?.name}
                  </p>
                  <p className="font-display text-sm font-extrabold text-slate-300 tabular-nums mt-0.5">
                    {totals[sortedPlayerIds[1]]} pts
                  </p>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {sortedPlayerIds[0] && (
              <div className="flex-1 flex flex-col items-center text-center -mt-3">
                <div className="relative mb-1">
                  <span className="text-3xl">{champion?.avatar}</span>
                  <span className="absolute -top-3 -right-2 text-lg">👑</span>
                </div>
                <div className="w-full bg-amber-950/40 border-2 border-amber-400/80 rounded-t-2xl p-3 flex flex-col items-center shadow-lg shadow-amber-950/50">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Champion</span>
                  <p className="text-xs font-bold text-white truncate max-w-full">
                    {champion?.name}
                  </p>
                  <p className="font-display text-base font-black text-amber-300 tabular-nums mt-0.5">
                    {totals[championId]} pts
                  </p>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {sortedPlayerIds[2] && (
              <div className="flex-1 flex flex-col items-center text-center">
                <div className="text-2xl mb-1">{getPlayer(sortedPlayerIds[2])?.avatar}</div>
                <div className="w-full bg-slate-800/60 border border-slate-700/80 rounded-t-2xl p-2.5 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-amber-700 uppercase">3rd Place</span>
                  <p className="text-xs font-bold text-white truncate max-w-full">
                    {getPlayer(sortedPlayerIds[2])?.name}
                  </p>
                  <p className="font-display text-sm font-extrabold text-slate-300 tabular-nums mt-0.5">
                    {totals[sortedPlayerIds[2]]} pts
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="truncate">
                <p className="text-[10px] text-slate-400">Joker 0-Point Specialist</p>
                <p className="font-semibold text-white truncate">
                  {bestZeroPlayer?.name} ({maxZeros} rounds)
                </p>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <p className="text-[10px] text-slate-400">Lifetime Stats</p>
                <p className="font-semibold text-emerald-400 truncate">Saved to Leaderboard</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onViewScoreSheet}
            className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <BarChart2 className="w-4 h-4" />
            <span>Score Sheet</span>
          </button>

          <button
            type="button"
            onClick={onViewLeaderboard}
            className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Leaderboard</span>
          </button>

          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950 transition-all active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Match</span>
          </button>
        </div>
      </div>
    </div>
  );
};
