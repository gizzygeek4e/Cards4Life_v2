import React, { useState } from 'react';
import { History as HistoryIcon, Trophy, Calendar, Eye, Trash2, ArrowRight } from 'lucide-react';
import { GameMatch, Player } from '../../types';
import { ScoreSheetModal } from '../ActiveGame/ScoreSheetModal';
import { storage } from '../../utils/storage';

interface MatchHistoryProps {
  matches: GameMatch[];
  players: Player[];
  onStartNewGame: () => void;
  onRefreshMatches: () => void;
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({
  matches,
  players,
  onStartNewGame,
  onRefreshMatches,
}) => {
  const [selectedMatch, setSelectedMatch] = useState<GameMatch | null>(null);

  const getPlayer = (id: string) => players.find((p) => p.id === id);

  const handleDeleteMatch = (matchId: string) => {
    if (window.confirm('Delete this match record from history?')) {
      const updated = matches.filter((m) => m.id !== matchId);
      storage.saveMatchHistory(updated);
      onRefreshMatches();
    }
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-28 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-black text-white tracking-tight flex items-center gap-2">
            Match Archives
            <span className="text-xs font-semibold text-slate-400 bg-slate-800 px-2 py-0.5 rounded-md">
              {matches.length} Matches
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Past completed card tournaments and round-by-round archives
          </p>
        </div>

        <button
          type="button"
          onClick={onStartNewGame}
          className="touch-btn min-h-[40px] px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-950 flex items-center justify-center gap-2 transition-all active:scale-98"
        >
          <span>Start New Match</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Empty State */}
      {matches.length === 0 ? (
        <div className="bg-slate-900 border border-slate-800 rounded-3xl p-10 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mx-auto text-3xl">
            🃏
          </div>
          <div className="max-w-sm mx-auto">
            <h3 className="font-display font-bold text-lg text-white">No Completed Matches Yet</h3>
            <p className="text-xs text-slate-400 mt-1">
              Start your first American Joker 5-round match or standard card game. When the game wraps up, full round summaries will appear here!
            </p>
          </div>
          <button
            type="button"
            onClick={onStartNewGame}
            className="touch-btn px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950 inline-flex items-center gap-2"
          >
            <span>Play First Match</span>
          </button>
        </div>
      ) : (
        /* Match list cards */
        <div className="space-y-3">
          {matches.map((match) => {
            const winner = match.winnerPlayerId ? getPlayer(match.winnerPlayerId) : null;
            const completedTime = match.completedAt || match.startedAt;

            return (
              <div
                key={match.id}
                className="bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-2xl p-4 transition-all space-y-3"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-[11px] text-slate-400 mb-0.5">
                      <span className="font-semibold text-amber-400">
                        {match.mode === 'AMERICAN_JOKER' ? 'American Joker (5 Rounds)' : 'Standard Points'}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatDate(completedTime)}
                      </span>
                    </div>
                    <h3 className="font-display font-bold text-base text-white truncate">
                      {match.title}
                    </h3>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => setSelectedMatch(match)}
                      className="touch-btn min-h-[36px] px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
                      title="View full round matrix"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Details</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteMatch(match.id)}
                      className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                      title="Delete record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Match Summary Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-950/70 border border-slate-800/80 rounded-xl">
                  {/* Winner slot */}
                  {winner && (
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{winner.avatar}</span>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-amber-400 block tracking-wider">
                          Match Champion
                        </span>
                        <p className="text-xs font-bold text-white flex items-center gap-1">
                          {winner.name} 👑
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Players participated */}
                  <div className="flex items-center gap-2 text-xs text-slate-400">
                    <span>Players:</span>
                    <div className="flex -space-x-1.5">
                      {match.playerIds.map((pid) => {
                        const p = getPlayer(pid);
                        if (!p) return null;
                        return (
                          <div
                            key={pid}
                            className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-xs"
                            title={p.name}
                          >
                            {p.avatar}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Total Rounds */}
                  <div className="text-xs text-slate-400">
                    <span>Rounds: </span>
                    <strong className="text-slate-200">{match.rounds.length}</strong>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Details Sheet Modal */}
      {selectedMatch && (
        <ScoreSheetModal
          isOpen={true}
          onClose={() => setSelectedMatch(null)}
          match={selectedMatch}
          players={players}
        />
      )}
    </div>
  );
};
