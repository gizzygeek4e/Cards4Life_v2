import React, { useState } from 'react';
import { History as HistoryIcon, Trophy, Calendar, Eye, Trash2, ArrowRight, ExternalLink, Bookmark, CheckCircle } from 'lucide-react';
import { GameMatch, Player } from '../../types';
import { ScoreSheetModal } from '../ActiveGame/ScoreSheetModal';
import { SavedDraftsList } from '../ActiveGame/SavedDraftsList';
import { storage } from '../../utils/storage';
import fourieFamilyLogo from '../../assets/images/fourie_family_logo.jpeg';

interface MatchHistoryProps {
  matches: GameMatch[];
  players: Player[];
  drafts?: GameMatch[];
  onResumeDraft?: (draft: GameMatch) => void;
  onDeleteDraft?: (draftId: string) => void;
  onStartNewGame: () => void;
  onRefreshMatches: () => void;
}

export const MatchHistory: React.FC<MatchHistoryProps> = ({
  matches,
  players,
  drafts = [],
  onResumeDraft,
  onDeleteDraft,
  onStartNewGame,
  onRefreshMatches,
}) => {
  const [activeHistoryTab, setActiveHistoryTab] = useState<'completed' | 'drafts'>('completed');
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
      {/* Heraldic Fourie Family Crest Banner */}
      <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-white via-slate-50 to-white dark:from-[#0d223d] dark:via-[#091a2f] dark:to-[#0d223d] border border-slate-200 dark:border-[#1b3558] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm dark:shadow-xl">
        <div className="flex items-center gap-3.5">
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl overflow-hidden border-2 border-amber-500/80 dark:border-amber-400/90 shadow-md shrink-0 bg-[#071322] p-0.5">
            <img src={fourieFamilyLogo} alt="Fourie Family Crest" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 block font-display">
              FOURIE FAMILY CHRONICLES
            </span>
            <h1 className="font-heraldic text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Match Archives & Drafts
            </h1>
            <p className="text-xs text-slate-600 dark:text-blue-200/80 mt-0.5">
              Completed tournament record book & saved in-progress games
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onStartNewGame}
          className="touch-btn min-h-[40px] px-4 py-2 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-500 border border-blue-400/40 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-950/20 flex items-center justify-center gap-2 transition-all active:scale-98 self-start sm:self-auto"
        >
          <span>Start New Match</span>
          <ArrowRight className="w-4 h-4 text-amber-300" />
        </button>
      </div>

      {/* Segmented Tab Controls: Completed Matches vs Saved Drafts */}
      <div className="flex items-center gap-2 p-1 bg-slate-100 dark:bg-[#09182b] border border-slate-200 dark:border-[#1b3558] rounded-2xl w-full sm:w-auto self-start">
        <button
          type="button"
          onClick={() => setActiveHistoryTab('completed')}
          className={`flex-1 sm:flex-none min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeHistoryTab === 'completed'
              ? 'bg-white dark:bg-[#122844] text-slate-900 dark:text-white shadow-sm border border-slate-200 dark:border-blue-500/40'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <CheckCircle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
          <span>Completed Matches</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 dark:bg-[#071322] text-slate-700 dark:text-amber-300 font-mono">
            {matches.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setActiveHistoryTab('drafts')}
          className={`flex-1 sm:flex-none min-h-[38px] px-4 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
            activeHistoryTab === 'drafts'
              ? 'bg-amber-400 text-slate-950 shadow border border-amber-300'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Bookmark className="w-3.5 h-3.5" />
          <span>Saved Drafts</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
            activeHistoryTab === 'drafts' ? 'bg-[#071322] text-amber-300' : 'bg-slate-200 dark:bg-[#071322] text-slate-700 dark:text-slate-400'
          }`}>
            {drafts.length}
          </span>
        </button>
      </div>

      {/* TAB 1: SAVED DRAFTS */}
      {activeHistoryTab === 'drafts' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>In-progress game drafts automatically preserved on this device</span>
          </div>

          <SavedDraftsList
            drafts={drafts}
            players={players}
            onResumeDraft={(draft) => {
              if (onResumeDraft) onResumeDraft(draft);
            }}
            onDeleteDraft={(id) => {
              if (onDeleteDraft) onDeleteDraft(id);
            }}
            onStartNewGame={onStartNewGame}
          />
        </div>
      )}

      {/* TAB 2: COMPLETED MATCHES */}
      {activeHistoryTab === 'completed' && (
        <>
          {matches.length === 0 ? (
            <div className="bg-white dark:bg-[#09182b] border border-slate-200 dark:border-[#1b385e] rounded-3xl p-10 text-center space-y-4 shadow-sm dark:shadow-none">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-[#0c1c30] border border-slate-200 dark:border-[#1b385e] flex items-center justify-center mx-auto text-3xl">
                🃏
              </div>
              <div className="max-w-sm mx-auto">
                <h3 className="font-heraldic font-bold text-lg text-slate-900 dark:text-white">No Completed Matches Yet</h3>
                <p className="text-xs text-slate-600 dark:text-blue-200/80 mt-1">
                  Start your first American Joker 5-round match or standard card game. When the game wraps up, full round summaries will appear here!
                </p>
              </div>
              <button
                type="button"
                onClick={onStartNewGame}
                className="touch-btn px-5 py-2.5 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-500 border border-blue-400/40 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-950/20 inline-flex items-center gap-2"
              >
                <span>Play First Match</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {matches.map((match) => {
                const winner = match.winnerPlayerId ? getPlayer(match.winnerPlayerId) : null;
                const completedTime = match.completedAt || match.startedAt;

                return (
                  <div
                    key={match.id}
                    className="bg-white dark:bg-[#0c1c30] border border-slate-200 dark:border-[#1b3558] hover:border-amber-400/50 dark:hover:border-amber-400/40 rounded-2xl p-4 transition-all space-y-3 shadow-sm dark:shadow-none"
                  >
                    {/* Header row */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3 min-w-0">
                        {match.photoUrl && (
                          <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 shrink-0 shadow-sm">
                            <img
                              src={match.photoUrl}
                              alt={match.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 mb-0.5 flex-wrap">
                            <span className="font-semibold text-amber-600 dark:text-amber-400">
                              {match.mode === 'AMERICAN_JOKER' ? 'American Joker (5 Rounds)' : 'Standard Points'}
                            </span>
                            <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDate(completedTime)}
                            </span>
                            {match.googlePhotosUrl && (
                              <>
                                <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                                <a
                                  href={match.googlePhotosUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-amber-600 dark:text-amber-400 hover:text-amber-500 dark:hover:text-amber-300 font-semibold flex items-center gap-0.5"
                                  title="View in Google Photos album"
                                >
                                  <span>Google Photos</span>
                                  <ExternalLink className="w-2.5 h-2.5" />
                                </a>
                              </>
                            )}
                          </div>
                          <h3 className="font-heraldic font-bold text-base text-slate-900 dark:text-white truncate">
                            {match.title}
                          </h3>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => setSelectedMatch(match)}
                          className="touch-btn min-h-[36px] px-3 py-1.5 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors border border-slate-200 dark:border-transparent"
                          title="View full round matrix"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                          <span>Details</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteMatch(match.id)}
                          className="w-9 h-9 flex items-center justify-center rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Match Summary Strip */}
                    <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-[#071322] border border-slate-200 dark:border-slate-800/80 rounded-xl">
                      {/* Winner slot */}
                      {winner && (
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{winner.avatar}</span>
                          <div>
                            <span className="text-[10px] uppercase font-bold text-amber-600 dark:text-amber-400 block tracking-wider font-display">
                              Match Champion
                            </span>
                            <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                              {winner.name} 👑
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Players participated */}
                      <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                        <span>Players:</span>
                        <div className="flex -space-x-1.5">
                          {match.playerIds.map((pid) => {
                            const p = getPlayer(pid);
                            if (!p) return null;
                            return (
                              <div
                                key={pid}
                                className="w-7 h-7 rounded-full bg-slate-200 dark:bg-slate-800 border border-white dark:border-slate-700 flex items-center justify-center text-xs"
                                title={p.name}
                              >
                                {p.avatar}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Total Rounds */}
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        <span>Rounds: </span>
                        <strong className="text-slate-800 dark:text-slate-200">{match.rounds.length}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
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
