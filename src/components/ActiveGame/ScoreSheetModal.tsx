import React, { useState } from 'react';
import { X, Trophy, Edit3, Check } from 'lucide-react';
import { GameMatch, Player } from '../../types';

interface ScoreSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  match: GameMatch;
  players: Player[];
  onUpdateRoundScore?: (roundIndex: number, playerId: string, newScore: number) => void;
}

export const ScoreSheetModal: React.FC<ScoreSheetModalProps> = ({
  isOpen,
  onClose,
  match,
  players,
  onUpdateRoundScore,
}) => {
  const [editingCell, setEditingCell] = useState<{ roundIdx: number; playerId: string; val: number } | null>(null);

  if (!isOpen) return null;

  // Calculate cumulative totals per player
  const playerTotals: Record<string, number> = {};
  match.playerIds.forEach((pid) => {
    playerTotals[pid] = 0;
  });

  match.rounds.forEach((round, rIdx) => {
    if (rIdx <= match.currentRoundIndex) {
      match.playerIds.forEach((pid) => {
        playerTotals[pid] = (playerTotals[pid] || 0) + (round.scores[pid]?.score || 0);
      });
    }
  });

  // Sort players by standing
  const sortedPlayerIds = [...match.playerIds].sort((a, b) => {
    const scoreA = playerTotals[a] ?? 0;
    const scoreB = playerTotals[b] ?? 0;
    return match.winningCondition === 'LOWEST_SCORE' ? scoreA - scoreB : scoreB - scoreA;
  });

  const getPlayer = (id: string) => players.find((p) => p.id === id);

  const handleSaveCell = () => {
    if (editingCell && onUpdateRoundScore) {
      onUpdateRoundScore(editingCell.roundIdx, editingCell.playerId, editingCell.val);
      setEditingCell(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-display font-bold text-base text-white">{match.title} · Score Matrix</h3>
              <p className="text-xs text-slate-400">
                {match.mode === 'AMERICAN_JOKER' ? 'American Joker (5 Rounds)' : 'Standard Points'} ·{' '}
                {match.winningCondition === 'LOWEST_SCORE' ? 'Lowest Score Wins' : 'Highest Score Wins'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Matrix Table */}
        <div className="p-4 overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300 border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 font-semibold uppercase tracking-wider">Player</th>
                {match.rounds.map((r, idx) => (
                  <th key={r.roundNumber} className="py-2.5 px-2 text-center font-semibold">
                    <span className="block whitespace-nowrap">R{r.roundNumber}</span>
                    <span className="text-[10px] text-slate-500 font-normal">
                      {idx < match.currentRoundIndex
                        ? 'Done'
                        : idx === match.currentRoundIndex
                        ? 'Current'
                        : 'Upcoming'}
                    </span>
                  </th>
                ))}
                <th className="py-2.5 px-3 text-right font-bold text-amber-400 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {sortedPlayerIds.map((pid, rank) => {
                const player = getPlayer(pid);
                if (!player) return null;
                const total = playerTotals[pid] || 0;
                const isLeader = rank === 0;

                return (
                  <tr key={pid} className={`hover:bg-slate-800/40 transition-colors ${isLeader ? 'bg-amber-950/20' : ''}`}>
                    <td className="py-3 px-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{player.avatar}</span>
                        <div>
                          <p className="font-semibold text-white flex items-center gap-1">
                            {player.name}
                            {isLeader && <span className="text-amber-400 text-xs">👑 #{rank + 1}</span>}
                          </p>
                          <p className="text-[10px] text-slate-400">{player.nickname}</p>
                        </div>
                      </div>
                    </td>

                    {match.rounds.map((round, rIdx) => {
                      const scoreObj = round.scores[pid];
                      const isPlayed = rIdx <= match.currentRoundIndex;
                      const isWinner = scoreObj?.isRoundWinner || scoreObj?.score === 0;

                      return (
                        <td key={round.roundNumber} className="py-3 px-2 text-center whitespace-nowrap">
                          {isPlayed ? (
                            <button
                              type="button"
                              onClick={() => {
                                if (onUpdateRoundScore && rIdx <= match.currentRoundIndex) {
                                  setEditingCell({
                                    roundIdx: rIdx,
                                    playerId: pid,
                                    val: scoreObj ? scoreObj.score : 0,
                                  });
                                }
                              }}
                              className={`group inline-flex items-center justify-center px-2 py-1 rounded-md text-xs font-semibold tabular-nums transition-all ${
                                isWinner
                                  ? 'bg-amber-950/50 text-amber-300 border border-amber-500/40 font-bold'
                                  : 'text-slate-200 hover:bg-slate-800'
                              }`}
                              title="Click to edit round score"
                            >
                              <span>{scoreObj ? scoreObj.score : 0}</span>
                              {isWinner && <span className="ml-1 text-[10px]">⭐</span>}
                            </button>
                          ) : (
                            <span className="text-slate-600">-</span>
                          )}
                        </td>
                      );
                    })}

                    <td className="py-3 px-3 text-right whitespace-nowrap">
                      <span className={`font-display text-sm font-bold tabular-nums ${isLeader ? 'text-amber-300' : 'text-white'}`}>
                        {total}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Edit Cell Drawer/Dialog */}
        {editingCell && (
          <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-amber-400" />
              <span className="text-xs text-slate-300">
                Edit R{editingCell.roundIdx + 1} score for <strong>{getPlayer(editingCell.playerId)?.name}</strong>:
              </span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="number"
                value={editingCell.val}
                onChange={(e) =>
                  setEditingCell({
                    ...editingCell,
                    val: parseInt(e.target.value, 10) || 0,
                  })
                }
                className="w-20 px-2 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-white text-center font-bold text-sm focus:outline-none focus:border-amber-400"
              />
              <button
                type="button"
                onClick={handleSaveCell}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
              >
                <Check className="w-3.5 h-3.5 text-amber-300" />
                <span>Save</span>
              </button>
              <button
                type="button"
                onClick={() => setEditingCell(null)}
                className="px-2.5 py-1.5 text-slate-400 hover:text-white text-xs"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="p-3 bg-slate-950/80 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
          <span>Tap any completed score to edit or correct.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
          >
            Close Sheet
          </button>
        </div>
      </div>
    </div>
  );
};
