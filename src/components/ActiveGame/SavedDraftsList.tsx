import React, { useState } from 'react';
import { GameMatch, Player } from '../../types';
import { Play, Trash2, Clock, Users, Trophy, AlertTriangle, Sparkles, Image as ImageIcon } from 'lucide-react';

interface SavedDraftsListProps {
  drafts: GameMatch[];
  players: Player[];
  activeMatchId?: string;
  onResumeDraft: (draft: GameMatch) => void;
  onDeleteDraft: (draftId: string) => void;
  onStartNewGame?: () => void;
}

export const SavedDraftsList: React.FC<SavedDraftsListProps> = ({
  drafts,
  players,
  activeMatchId,
  onResumeDraft,
  onDeleteDraft,
  onStartNewGame,
}) => {
  const [draftToDelete, setDraftToDelete] = useState<GameMatch | null>(null);

  const getPlayer = (id: string) => players.find((p) => p.id === id);

  const formatRelativeTime = (timestamp?: number) => {
    if (!timestamp) return 'Just now';
    const diffMs = Date.now() - timestamp;
    const diffSecs = Math.floor(diffMs / 1000);
    const diffMins = Math.floor(diffSecs / 60);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSecs < 60) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins === 1 ? '' : 's'} ago`;
    if (diffHours < 24) return `${diffHours} hr${diffHours === 1 ? '' : 's'} ago`;
    if (diffDays === 1) return 'Yesterday';
    return new Date(timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (drafts.length === 0) {
    return (
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 text-center space-y-3">
        <div className="w-12 h-12 rounded-xl bg-slate-800/80 flex items-center justify-center mx-auto text-xl text-slate-400">
          📁
        </div>
        <div className="max-w-xs mx-auto">
          <p className="font-bold text-sm text-slate-200">No Saved Drafts</p>
          <p className="text-xs text-slate-400 mt-0.5">
            When you start or pause a match, in-progress drafts will appear here safely stored on your device.
          </p>
        </div>
        {onStartNewGame && (
          <button
            type="button"
            onClick={onStartNewGame}
            className="touch-btn px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition-colors inline-flex items-center gap-1.5"
          >
            <span>Start a Game</span>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {drafts.map((draft) => {
        const isActive = activeMatchId === draft.id;
        const currentRoundNumber = (draft.currentRoundIndex || 0) + 1;
        const totalRounds = draft.maxRounds || 5;

        // Calculate current cumulative scores for the draft
        const draftTotals: Record<string, number> = {};
        draft.playerIds.forEach((pid) => (draftTotals[pid] = 0));
        draft.rounds.forEach((r, idx) => {
          if (idx <= (draft.currentRoundIndex || 0)) {
            draft.playerIds.forEach((pid) => {
              draftTotals[pid] = (draftTotals[pid] || 0) + (r.scores[pid]?.score || 0);
            });
          }
        });

        // Determine leader
        const leaderId = [...draft.playerIds].sort((a, b) => {
          const scA = draftTotals[a] ?? 0;
          const scB = draftTotals[b] ?? 0;
          return draft.winningCondition === 'LOWEST_SCORE' ? scA - scB : scB - scA;
        })[0];
        const leader = getPlayer(leaderId);

        return (
          <div
            key={draft.id}
            className={`p-4 sm:p-5 rounded-2xl border transition-all ${
              isActive
                ? 'bg-emerald-950/40 border-emerald-500/60 shadow-lg shadow-emerald-950/50 ring-1 ring-emerald-500/30'
                : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
            }`}
          >
            {/* Top row: Match title, mode, time */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      draft.mode === 'AMERICAN_JOKER'
                        ? 'bg-amber-950/60 border-amber-500/40 text-amber-300'
                        : 'bg-sky-950/60 border-sky-500/40 text-sky-300'
                    }`}
                  >
                    {draft.mode === 'AMERICAN_JOKER' ? 'American Joker' : 'Standard'}
                  </span>

                  <span className="text-[10px] font-bold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                    Round {currentRoundNumber} of {totalRounds}
                  </span>

                  {draft.photoUrl && (
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded flex items-center gap-1">
                      <ImageIcon className="w-3 h-3" />
                      <span>Photo</span>
                    </span>
                  )}

                  {isActive && (
                    <span className="text-[10px] font-bold bg-emerald-500 text-slate-950 px-2 py-0.5 rounded animate-pulse">
                      Currently on Table
                    </span>
                  )}
                </div>

                <h3 className="font-display font-black text-base sm:text-lg text-white">
                  {draft.title || 'Untitled Match'}
                </h3>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-400 self-start sm:self-auto">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{formatRelativeTime(draft.updatedAt || draft.startedAt)}</span>
              </div>
            </div>

            {/* Middle: Player standings in this draft */}
            <div className="py-3">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="flex items-center gap-1.5 font-medium">
                  <Users className="w-3.5 h-3.5" />
                  <span>{draft.playerIds.length} Players</span>
                </span>

                {leader && (
                  <span className="flex items-center gap-1 text-amber-400 font-semibold text-[11px]">
                    <Trophy className="w-3 h-3" />
                    <span>Leading: {leader.name} ({draftTotals[leader.id]} pts)</span>
                  </span>
                )}
              </div>

              {/* Player pills */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {draft.playerIds.map((pid) => {
                  const p = getPlayer(pid);
                  if (!p) return null;
                  const isLeader = pid === leaderId;
                  const pts = draftTotals[pid] ?? 0;

                  return (
                    <div
                      key={pid}
                      className={`px-2.5 py-1.5 rounded-xl border flex items-center justify-between text-xs ${
                        isLeader
                          ? 'bg-amber-950/30 border-amber-500/40 text-amber-200'
                          : 'bg-slate-950/60 border-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate mr-1">
                        <span className="text-sm shrink-0">{p.avatar}</span>
                        <span className="font-bold truncate text-[11px]">{p.name}</span>
                      </div>
                      <span className="font-mono font-bold tabular-nums text-xs text-amber-400 shrink-0">
                        {pts}p
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom: Action buttons */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setDraftToDelete(draft)}
                className="touch-btn min-h-[38px] px-3 py-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 border border-transparent hover:border-rose-900/40 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Discard this draft"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Draft</span>
              </button>

              <button
                type="button"
                onClick={() => onResumeDraft(draft)}
                className="touch-btn min-h-[40px] px-5 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-emerald-950 active:scale-98 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>{isActive ? 'Continue Playing' : 'Resume Match'}</span>
              </button>
            </div>
          </div>
        );
      })}

      {/* Delete Confirmation Modal */}
      {draftToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-white">Delete Game Draft?</h3>
                <p className="text-xs text-slate-400">{draftToDelete.title}</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Are you sure you want to delete this saved draft? Its current scores and progress will be permanently removed. Lifetime statistics for players will not be affected.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDraftToDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  onDeleteDraft(draftToDelete.id);
                  setDraftToDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-950 transition-colors"
              >
                Delete Draft
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
