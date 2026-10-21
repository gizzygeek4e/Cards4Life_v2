import React from 'react';
import { X, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { GameMatch, GameRound, Player } from '../../types';

interface RoundReviewSheetProps {
  isOpen: boolean;
  onClose: () => void;
  match: GameMatch;
  currentRound: GameRound;
  players: Player[];
  onConfirmFinalize: () => void;
}

export const RoundReviewSheet: React.FC<RoundReviewSheetProps> = ({
  isOpen,
  onClose,
  match,
  currentRound,
  players,
  onConfirmFinalize,
}) => {
  if (!isOpen) return null;

  const getPlayer = (id: string) => players.find((p) => p.id === id);

  // Check if anyone went out with 0 score
  const winners = Object.values(currentRound.scores).filter((s) => s.isRoundWinner || s.score === 0);
  const hasZeroWinner = winners.length > 0;

  // Calculate projected new totals
  const projectedTotals: Record<string, { current: number; round: number; projected: number }> = {};
  match.playerIds.forEach((pid) => {
    let prior = 0;
    match.rounds.slice(0, match.currentRoundIndex).forEach((r) => {
      prior += r.scores[pid]?.score || 0;
    });
    const roundPts = currentRound.scores[pid]?.score || 0;
    projectedTotals[pid] = {
      current: prior,
      round: roundPts,
      projected: prior + roundPts,
    };
  });

  const sortedPlayerIds = [...match.playerIds].sort((a, b) => {
    const ptA = projectedTotals[a]?.projected ?? 0;
    const ptB = projectedTotals[b]?.projected ?? 0;
    return match.winningCondition === 'LOWEST_SCORE' ? ptA - ptB : ptB - ptA;
  });

  const isFinalRound = match.currentRoundIndex >= match.maxRounds - 1;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border-t sm:border border-slate-700 rounded-t-3xl sm:rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Mobile handle indicator */}
        <div className="w-12 h-1.5 bg-slate-700 rounded-full mx-auto my-2.5 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-slate-800">
          <div>
            <h3 className="font-display font-bold text-base text-white">
              Finalise {currentRound.name}
            </h3>
            <p className="text-xs text-slate-400">
              Review round points before locking into match history
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 overflow-y-auto space-y-4">
          {/* Winner status notice */}
          {match.mode === 'AMERICAN_JOKER' && !hasZeroWinner && (
            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-start gap-2.5 text-xs text-amber-200">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-semibold">No 0-Score Winner Marked</strong>
                In American Joker, usually the first player to go out gets 0 points and everyone else takes penalty card points. You can still proceed if this was intentional.
              </div>
            </div>
          )}

          {hasZeroWinner && (
            <div className="p-3 rounded-xl bg-[#0e2444] border border-blue-500/40 flex items-center gap-2.5 text-xs text-blue-100">
              <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <strong className="font-semibold text-amber-300">Round Winner Preserved: </strong>
                {winners.map((w) => getPlayer(w.playerId)?.name).join(', ')} scored 0 points!
              </div>
            </div>
          )}

          {/* Scores list */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 px-2 uppercase tracking-wider">
              <span>Player</span>
              <div className="flex items-center gap-6">
                <span>This Round</span>
                <span>Projected Total</span>
              </div>
            </div>

            <div className="divide-y divide-slate-800/80 bg-slate-950/60 rounded-xl border border-slate-800/80 overflow-hidden">
              {sortedPlayerIds.map((pid, rank) => {
                const player = getPlayer(pid);
                const scoreObj = currentRound.scores[pid];
                const stats = projectedTotals[pid];
                const isWinner = scoreObj?.isRoundWinner || scoreObj?.score === 0;

                return (
                  <div key={pid} className="p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="text-xl shrink-0">{player?.avatar}</span>
                      <div className="truncate">
                        <p className="text-xs font-bold text-white flex items-center gap-1.5 truncate">
                          {player?.name}
                          {isWinner && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-500/40 font-bold">
                              Winner (0)
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          Standing: #{rank + 1}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6 shrink-0">
                      <span
                        className={`font-display text-sm font-bold tabular-nums min-w-[45px] text-right ${
                          isWinner ? 'text-amber-300' : 'text-slate-200'
                        }`}
                      >
                        +{scoreObj ? scoreObj.score : 0}
                      </span>
                      <span className="font-display text-sm font-black text-white tabular-nums min-w-[50px] text-right">
                        {stats?.projected}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center gap-2.5 pb-safe">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800 font-semibold text-xs transition-colors"
          >
            Keep Editing
          </button>
          <button
            type="button"
            onClick={onConfirmFinalize}
            className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-500 border border-blue-400/40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-950 active:scale-98 transition-all"
          >
            <span>{isFinalRound ? 'Lock & Finish Match' : 'Lock & Advance Round'}</span>
            <ArrowRight className="w-4 h-4 text-amber-300" />
          </button>
        </div>
      </div>
    </div>
  );
};
