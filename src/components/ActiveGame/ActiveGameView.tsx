import React, { useState, useRef } from 'react';
import {
  Trophy,
  Undo2,
  Table,
  CheckCircle,
  HelpCircle,
  RotateCcw,
  Sparkles,
  Award,
  Camera,
  Bookmark,
  AlertTriangle,
  Save,
} from 'lucide-react';
import { GameMatch, Player, AMERICAN_JOKER_ROUNDS } from '../../types';
import { HoldStepper } from '../HoldStepper';
import { RoundReviewSheet } from './RoundReviewSheet';
import { ScoreSheetModal } from './ScoreSheetModal';
import { GameVictoryModal } from './GameVictoryModal';
import { soundManager } from '../../utils/audio';
import { processImageFile } from '../../utils/imageUtils';
import fourieFamilyLogo from '../../assets/images/fourie_family_logo.jpeg';

interface ActiveGameViewProps {
  match: GameMatch;
  players: Player[];
  draftsCount?: number;
  onUpdateMatch: (updated: GameMatch) => void;
  onFinishMatch: (completedMatch: GameMatch) => void;
  onNewGameRequest: () => void;
  onNavigateTab: (tab: string) => void;
  onSaveDraftAndExit: () => void;
  onAbandonMatch: () => void;
  onShowStorageInfo?: () => void;
  onOpenDraftsModal?: () => void;
}

export const ActiveGameView: React.FC<ActiveGameViewProps> = ({
  match,
  players,
  draftsCount = 0,
  onUpdateMatch,
  onFinishMatch,
  onNewGameRequest,
  onNavigateTab,
  onSaveDraftAndExit,
  onAbandonMatch,
  onShowStorageInfo,
  onOpenDraftsModal,
}) => {
  const [showScoreSheet, setShowScoreSheet] = useState<boolean>(false);
  const [showReviewSheet, setShowReviewSheet] = useState<boolean>(false);
  const [showVictoryModal, setShowVictoryModal] = useState<boolean>(false);
  const [showPointHelp, setShowPointHelp] = useState<boolean>(false);
  const [showAbandonConfirm, setShowAbandonConfirm] = useState<boolean>(false);
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const processed = await processImageFile(file, 1280, 0.85);
      onUpdateMatch({
        ...match,
        photoUrl: processed,
        googlePhotosUploaded: false,
      });
    } catch (err) {
      console.error('Failed to process image:', err);
      alert('Could not process this image.');
    }
  };

  const currentRoundIndex = match.currentRoundIndex;
  const currentRound = match.rounds[currentRoundIndex];

  const getPlayer = (id: string) => players.find((p) => p.id === id);

  // Compute cumulative scores up to current round (excluding current draft)
  const priorScores: Record<string, number> = {};
  match.playerIds.forEach((pid) => {
    priorScores[pid] = 0;
  });

  for (let i = 0; i < currentRoundIndex; i++) {
    const r = match.rounds[i];
    match.playerIds.forEach((pid) => {
      priorScores[pid] = (priorScores[pid] || 0) + (r.scores[pid]?.score || 0);
    });
  }

  // Update a player's draft score for this round
  const handleScoreChange = (playerId: string, newScore: number) => {
    const updatedRounds = [...match.rounds];
    const targetRound = { ...updatedRounds[currentRoundIndex] };
    const prevScoreObj = targetRound.scores[playerId] || {
      playerId,
      score: 0,
      isRoundWinner: false,
    };

    targetRound.scores[playerId] = {
      ...prevScoreObj,
      score: newScore,
      // If score is changed away from 0, remove round winner flag
      isRoundWinner: newScore === 0 ? prevScoreObj.isRoundWinner : false,
    };

    updatedRounds[currentRoundIndex] = targetRound;
    onUpdateMatch({
      ...match,
      rounds: updatedRounds,
    });
  };

  // Toggle "Went Out (Round Winner)" with 0-score preservation
  const handleToggleWentOut = (playerId: string) => {
    const updatedRounds = [...match.rounds];
    const targetRound = { ...updatedRounds[currentRoundIndex] };
    const currentScoreObj = targetRound.scores[playerId] || {
      playerId,
      score: 0,
      isRoundWinner: false,
    };

    const isNowWinner = !currentScoreObj.isRoundWinner;

    if (isNowWinner) {
      soundManager.playRoundWinnerDing();
    }

    targetRound.scores[playerId] = {
      ...currentScoreObj,
      score: isNowWinner ? 0 : currentScoreObj.score,
      isRoundWinner: isNowWinner,
    };

    updatedRounds[currentRoundIndex] = targetRound;
    onUpdateMatch({
      ...match,
      rounds: updatedRounds,
    });
  };

  // Finalize round and advance
  const handleConfirmFinalize = () => {
    soundManager.playRoundFinalize();
    setShowReviewSheet(false);

    const isLastRound = currentRoundIndex >= match.maxRounds - 1;

    // Stamp finalized time
    const updatedRounds = [...match.rounds];
    updatedRounds[currentRoundIndex] = {
      ...updatedRounds[currentRoundIndex],
      finalizedAt: Date.now(),
    };

    if (isLastRound) {
      // Calculate final match totals
      const totals: Record<string, number> = {};
      match.playerIds.forEach((pid) => (totals[pid] = 0));
      updatedRounds.forEach((r) => {
        match.playerIds.forEach((pid) => {
          totals[pid] = (totals[pid] || 0) + (r.scores[pid]?.score || 0);
        });
      });

      const sorted = [...match.playerIds].sort((a, b) => {
        const scA = totals[a] ?? 0;
        const scB = totals[b] ?? 0;
        return match.winningCondition === 'LOWEST_SCORE' ? scA - scB : scB - scA;
      });

      const rankings = sorted.map((pid, idx) => ({
        playerId: pid,
        totalScore: totals[pid],
        rank: idx + 1,
      }));

      const completedMatch: GameMatch = {
        ...match,
        rounds: updatedRounds,
        completedAt: Date.now(),
        winnerPlayerId: sorted[0],
        finalRankings: rankings,
        status: 'COMPLETED',
      };

      onFinishMatch(completedMatch);
      setShowVictoryModal(true);
    } else {
      // Advance to next round
      onUpdateMatch({
        ...match,
        rounds: updatedRounds,
        currentRoundIndex: currentRoundIndex + 1,
      });
    }
  };

  // Undo previous round
  const handleUndoRound = () => {
    if (currentRoundIndex === 0) return;
    if (window.confirm(`Undo ${match.rounds[currentRoundIndex - 1]?.name} and re-open it for scoring?`)) {
      onUpdateMatch({
        ...match,
        currentRoundIndex: currentRoundIndex - 1,
      });
    }
  };

  // Current leader calculation for HUD
  const currentTotals: Record<string, number> = {};
  match.playerIds.forEach((pid) => {
    currentTotals[pid] = (priorScores[pid] || 0) + (currentRound.scores[pid]?.score || 0);
  });
  const currentLeaderId = [...match.playerIds].sort((a, b) => {
    const scA = currentTotals[a] ?? 0;
    const scB = currentTotals[b] ?? 0;
    return match.winningCondition === 'LOWEST_SCORE' ? scA - scB : scB - scA;
  })[0];
  const currentLeader = getPlayer(currentLeaderId);

  // American Joker round contract details
  const jokerConfig =
    match.mode === 'AMERICAN_JOKER'
      ? AMERICAN_JOKER_ROUNDS[currentRoundIndex] || null
      : null;

  return (
    <div className="pb-28">
      {/* Toast Feedback for Save */}
      {savedFeedback && (
        <div className="sticky top-14 z-50 px-4 py-2.5 bg-gradient-to-r from-blue-700 to-blue-600 border-b border-amber-400/60 text-white font-bold text-xs text-center shadow-xl flex items-center justify-center gap-2 animate-in slide-in-from-top">
          <Bookmark className="w-4 h-4 fill-amber-300 text-amber-300" />
          <span>{savedFeedback}</span>
        </div>
      )}

      {/* Top Game Hero Strip */}
      <div className="relative bg-gradient-to-b from-[#0e223d] via-[#091a2f] to-[#071322] border-b border-[#1b3558] pt-4 pb-5 px-4 shadow-xl">
        <div className="max-w-4xl mx-auto space-y-3">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-amber-400/90 shadow-[0_0_12px_rgba(217,155,38,0.3)] shrink-0 bg-[#071322]">
                <img src={fourieFamilyLogo} alt="Fourie Family" className="w-full h-full object-cover" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    {match.mode === 'AMERICAN_JOKER' ? 'American Joker (5 Rounds)' : 'Standard Match'}
                  </span>
                  <span className="text-blue-300">·</span>
                  <span className="text-[11px] text-blue-200">
                    {match.winningCondition === 'LOWEST_SCORE' ? 'Lowest Score Wins' : 'Highest Score Wins'}
                  </span>
                </div>
                <h1 className="font-display text-xl sm:text-2xl font-black text-white tracking-tight">
                  {match.title}
                </h1>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-2 flex-wrap shrink-0">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                className="hidden"
                onChange={handlePhotoSelect}
              />

              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`touch-btn min-h-[38px] px-2.5 py-1.5 border rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  match.photoUrl
                    ? 'bg-[#0f2847] border-blue-400/60 text-blue-200'
                    : 'bg-[#0c1c30] hover:bg-[#122844] border-[#1b385e] text-blue-200'
                }`}
                title={match.photoUrl ? 'Change match photo' : 'Add match photo (Google Photos)'}
              >
                {match.photoUrl ? (
                  <div className="w-5 h-5 rounded-md overflow-hidden shrink-0 border border-amber-400">
                    <img src={match.photoUrl} alt="Match" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <Camera className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className="hidden sm:inline">
                  {match.photoUrl ? 'Photo Added' : 'Add Photo'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowScoreSheet(true)}
                className="touch-btn min-h-[38px] px-3 py-1.5 bg-[#0c1c30] hover:bg-[#122844] border border-[#1b385e] rounded-xl text-blue-100 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Full Score Matrix"
              >
                <Table className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Score Sheet</span>
              </button>

              {currentRoundIndex > 0 && (
                <button
                  type="button"
                  onClick={handleUndoRound}
                  className="touch-btn min-h-[38px] px-2.5 py-1.5 bg-[#0c1c30] hover:bg-[#122844] border border-[#1b385e] rounded-xl text-blue-200 hover:text-white text-xs font-medium flex items-center gap-1 transition-colors"
                  title="Undo previous round"
                >
                  <Undo2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Undo</span>
                </button>
              )}

              <button
                type="button"
                onClick={onSaveDraftAndExit}
                className="touch-btn min-h-[38px] px-3 py-1.5 bg-blue-700 hover:bg-blue-600 border border-blue-400/50 rounded-xl text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
                title="Save draft and pause to return to table"
              >
                <Save className="w-3.5 h-3.5 text-amber-300" />
                <span>Save & Pause</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAbandonConfirm(true)}
                className="touch-btn min-h-[38px] px-2.5 py-1.5 bg-[#0c1c30] hover:bg-rose-950/50 border border-[#1b385e] hover:border-rose-900/60 text-slate-300 hover:text-rose-400 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Abandon and discard match"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Abandon</span>
              </button>
            </div>
          </div>

          {/* Round Progress Tracker */}
          <div className="bg-[#071322]/90 border border-[#1b3558] rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 shadow-inner">
            <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
              {match.rounds.map((r, idx) => {
                const isCurrent = idx === currentRoundIndex;
                const isCompleted = idx < currentRoundIndex;

                return (
                  <div
                    key={r.roundNumber}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-bold whitespace-nowrap transition-all ${
                      isCurrent
                        ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md shadow-amber-400/25 scale-105'
                        : isCompleted
                        ? 'bg-[#0e223d] border-blue-500/50 text-blue-200'
                        : 'bg-[#091729] border-[#142b47] text-blue-300/50'
                    }`}
                  >
                    <span>R{r.roundNumber}</span>
                    {isCompleted && <CheckCircle className="w-3 h-3 text-amber-400" />}
                  </div>
                );
              })}
            </div>

            {/* Current Dealer & Leader Indicator */}
            <div className="flex items-center justify-between sm:justify-end gap-3 text-xs pt-1 sm:pt-0 border-t sm:border-t-0 border-[#1b3558]">
              <div className="flex items-center gap-1.5 text-slate-200">
                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-950 font-black text-[10px] flex items-center justify-center shrink-0">
                  D
                </span>
                <span className="text-blue-300 text-[11px]">Dealer:</span>
                <strong className="text-white font-semibold">
                  {getPlayer(currentRound.dealerPlayerId)?.name || 'Next'}
                </strong>
              </div>

              {currentLeader && (
                <div className="flex items-center gap-1 text-slate-200 pl-3 border-l border-[#1b3558]">
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                  <span className="text-blue-300 text-[11px]">Leading:</span>
                  <strong className="text-amber-300 font-semibold truncate max-w-[80px]">
                    {currentLeader.name}
                  </strong>
                </div>
              )}
            </div>
          </div>

          {/* Draft Protection & Auto-Save Control Strip */}
          <div className="bg-[#09182b] border border-[#1c385f] rounded-2xl p-2.5 sm:p-3 flex flex-wrap items-center justify-between gap-2.5 shadow-inner">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-300 bg-[#0e2444] border border-blue-500/40 px-2.5 py-1 rounded-xl">
                <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                <span>Auto-Saved to Device Storage</span>
              </div>
              {onShowStorageInfo && (
                <button
                  type="button"
                  onClick={onShowStorageInfo}
                  className="text-[11px] text-blue-300/80 hover:text-amber-300 underline decoration-blue-600 transition-colors"
                >
                  Where is data stored?
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap ml-auto">
              {draftsCount > 1 && onOpenDraftsModal && (
                <button
                  type="button"
                  onClick={onOpenDraftsModal}
                  className="touch-btn min-h-[34px] px-2.5 py-1 rounded-xl bg-[#0c1c30] hover:bg-[#122844] border border-[#1b385e] text-blue-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>Other Drafts ({draftsCount})</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setSavedFeedback('Match draft safely saved to device storage!');
                  setTimeout(() => setSavedFeedback(null), 3500);
                  onUpdateMatch({ ...match, updatedAt: Date.now() });
                }}
                className="touch-btn min-h-[34px] px-3 py-1 rounded-xl bg-[#0e223d] hover:bg-[#143154] text-blue-100 border border-[#1e3e6b] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                title="Save current round scores checkpoint"
              >
                <Save className="w-3.5 h-3.5 text-amber-400" />
                <span>Save Now</span>
              </button>

              <button
                type="button"
                onClick={onSaveDraftAndExit}
                className="touch-btn min-h-[34px] px-3 py-1 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-blue-950 transition-colors"
                title="Pause this game and view all drafts"
              >
                <Bookmark className="w-3.5 h-3.5 fill-white" />
                <span>Save & Pause</span>
              </button>

              <button
                type="button"
                onClick={() => setShowAbandonConfirm(true)}
                className="touch-btn min-h-[34px] px-2.5 py-1 rounded-xl bg-[#0c1c30] hover:bg-rose-950/60 text-rose-300 border border-[#1b385e] hover:border-rose-900/60 text-xs font-semibold flex items-center gap-1 transition-colors"
                title="Abandon and discard this match"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Abandon</span>
              </button>
            </div>
          </div>

          {/* American Joker Contract Banner */}
          {jokerConfig && (
            <div className="p-3 bg-gradient-to-r from-[#0d223d] via-[#091a2f] to-[#12243d] border border-amber-400/30 rounded-2xl flex items-center justify-between gap-3 shadow-md">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-amber-400/10 border border-amber-400/40 flex items-center justify-center shrink-0">
                  <span className="text-xl">🃏</span>
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-black text-amber-400 uppercase tracking-wide">
                      {jokerConfig.name}
                    </span>
                    <span className="text-[10px] text-blue-300">· Deal: {jokerConfig.cardsDealt} Cards</span>
                  </div>
                  <p className="text-xs font-semibold text-white truncate">
                    Contract: <span className="text-amber-200">{jokerConfig.contract}</span>
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowPointHelp(!showPointHelp)}
                className="shrink-0 text-xs text-amber-300/90 hover:text-amber-300 underline underline-offset-2 flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Point Guide</span>
              </button>
            </div>
          )}

          {/* Quick Points Cheat Sheet drawer */}
          {showPointHelp && (
            <div className="p-3 bg-[#09182b] border border-[#1c385f] rounded-xl text-xs space-y-2 animate-in fade-in">
              <div className="flex items-center justify-between font-bold text-blue-100">
                <span>Hand Penalty Card Values:</span>
                <button
                  type="button"
                  onClick={() => setShowPointHelp(false)}
                  className="text-blue-300 hover:text-white"
                >
                  ✕
                </button>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px]">
                <div className="p-2 bg-[#0c1c30] rounded-lg border border-amber-500/40">
                  <span className="text-amber-300 font-bold">Joker:</span> 50 pts penalty
                </div>
                <div className="p-2 bg-[#0c1c30] rounded-lg border border-rose-500/40">
                  <span className="text-rose-300 font-bold">Ace:</span> 20 pts
                </div>
                <div className="p-2 bg-[#0c1c30] rounded-lg border border-blue-500/40">
                  <span className="text-blue-300 font-bold">K, Q, J:</span> 10 pts each
                </div>
                <div className="p-2 bg-[#0c1c30] rounded-lg border border-amber-500/30">
                  <span className="text-amber-200 font-bold">2 - 10:</span> Face value (or 5 pts)
                </div>
              </div>
              <p className="text-[10px] text-blue-200/80">
                Tip: The round winner goes out first and scores a preserved <strong>0 points</strong>. All other players count remaining cards!
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Main Scoring Grid (Mobile optimized stack, 2-column on larger screens) */}
      <div className="max-w-4xl mx-auto px-4 py-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {match.playerIds.map((playerId) => {
            const player = getPlayer(playerId);
            if (!player) return null;

            const scoreObj = currentRound.scores[playerId] || {
              playerId,
              score: 0,
              isRoundWinner: false,
            };
            const isWinner = scoreObj.isRoundWinner || (scoreObj.score === 0 && Object.values(currentRound.scores).some(s => s.isRoundWinner && s.playerId === playerId));
            const isDealer = currentRound.dealerPlayerId === playerId;
            const priorTotal = priorScores[playerId] || 0;
            const totalWithDraft = priorTotal + scoreObj.score;

            return (
              <div
                key={playerId}
                className={`relative rounded-2xl p-4 transition-all duration-200 border ${
                  isWinner
                    ? 'bg-gradient-to-b from-[#16273f] via-[#0c1c30] to-[#0c1c30] border-amber-400 shadow-[0_0_20px_rgba(217,155,38,0.2)] ring-1 ring-amber-400/50'
                    : 'bg-[#0c1c30] hover:bg-[#0f223a] border-[#1b385e]'
                }`}
              >
                {/* Player Header */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-sm border"
                      style={{
                        backgroundColor: `${player.color}25`,
                        borderColor: `${player.color}60`,
                      }}
                    >
                      {player.avatar}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-display font-bold text-base text-white truncate">
                          {player.name}
                        </h3>
                        {isDealer && (
                          <span
                            className="w-4 h-4 rounded-full bg-amber-400 text-slate-950 font-black text-[9px] flex items-center justify-center shrink-0"
                            title="Round Dealer"
                          >
                            D
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-blue-200/70 truncate">{player.nickname}</p>
                    </div>
                  </div>

                  {/* Prior & Projected Totals */}
                  <div className="text-right">
                    <div className="text-[10px] text-blue-300 uppercase font-semibold">
                      Total: <span className="text-white font-bold tabular-nums">{priorTotal}</span>
                    </div>
                    <div className="font-display text-lg font-black text-amber-300 tabular-nums">
                      {totalWithDraft}{' '}
                      <span className="text-[10px] font-normal text-blue-200">pts</span>
                    </div>
                  </div>
                </div>

                {/* Round Winner Action Button (0-score preservation) */}
                <div className="mb-3">
                  <button
                    type="button"
                    onClick={() => handleToggleWentOut(playerId)}
                    className={`touch-btn w-full min-h-[44px] py-2 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                      isWinner
                        ? 'bg-amber-400 text-slate-950 border border-amber-300 shadow-lg shadow-amber-400/25 active:scale-98'
                        : 'bg-[#081525] hover:bg-[#0e2136] text-blue-200 border border-[#1b385e] active:scale-98'
                    }`}
                  >
                    {isWinner ? (
                      <>
                        <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
                        <span>🏆 Went Out First · Preserved 0 Score!</span>
                      </>
                    ) : (
                      <>
                        <Award className="w-4 h-4 text-amber-400" />
                        <span>Went Out? (Mark Round Winner · 0 Pts)</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Point Stepper with hold acceleration and quick card chips */}
                <HoldStepper
                  value={scoreObj.score}
                  onChange={(val) => handleScoreChange(playerId, val)}
                  isWinner={isWinner}
                  allowNegative={match.winningCondition === 'HIGHEST_SCORE'}
                  showCardChips={true}
                />
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Finalise Action Bar (Natural Thumb Zone) */}
      <div className="fixed bottom-15 md:bottom-0 left-0 right-0 z-30 p-3 bg-gradient-to-t from-[#071322] via-[#071322]/95 to-[#071322]/80 border-t border-[#1b3558] backdrop-blur-md">
        <div className="max-w-4xl mx-auto flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setShowScoreSheet(true)}
            className="md:hidden min-h-[48px] px-3 bg-[#0c1c30] hover:bg-[#122844] border border-[#1b385e] rounded-xl text-blue-100 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
          >
            <Table className="w-4 h-4 text-amber-400" />
            <span>Sheet</span>
          </button>

          <button
            type="button"
            onClick={onSaveDraftAndExit}
            className="min-h-[48px] px-3 sm:px-4 bg-[#0c1c30] hover:bg-[#122844] border border-[#1b385e] rounded-xl text-amber-300 hover:text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors"
            title="Save match progress and pause"
          >
            <Bookmark className="w-4 h-4 fill-amber-400 text-amber-400" />
            <span className="hidden sm:inline">Save & Pause</span>
          </button>

          <button
            type="button"
            onClick={() => setShowReviewSheet(true)}
            className="touch-btn flex-1 min-h-[48px] py-3 px-4 sm:px-5 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-500 border border-blue-400/40 text-white font-extrabold text-sm flex items-center justify-center gap-2 shadow-xl shadow-blue-950/80 active:scale-[0.99] transition-all"
          >
            <span className="truncate">
              Finalise {currentRound.name}{' '}
              {currentRoundIndex >= match.maxRounds - 1 ? '(Finish Match)' : ''}
            </span>
            <CheckCircle className="w-5 h-5 text-amber-300 shrink-0" />
          </button>
        </div>
      </div>

      {/* Modals & Sheets */}
      <RoundReviewSheet
        isOpen={showReviewSheet}
        onClose={() => setShowReviewSheet(false)}
        match={match}
        currentRound={currentRound}
        players={players}
        onConfirmFinalize={handleConfirmFinalize}
      />

      <ScoreSheetModal
        isOpen={showScoreSheet}
        onClose={() => setShowScoreSheet(false)}
        match={match}
        players={players}
        onUpdateRoundScore={(rIdx, pid, val) => {
          const updated = [...match.rounds];
          if (updated[rIdx]) {
            updated[rIdx].scores[pid] = {
              ...(updated[rIdx].scores[pid] || { playerId: pid, score: 0, isRoundWinner: false }),
              score: val,
            };
            onUpdateMatch({ ...match, rounds: updated });
          }
        }}
      />

      <GameVictoryModal
        isOpen={showVictoryModal}
        match={match}
        players={players}
        onPlayAgain={() => {
          setShowVictoryModal(false);
          onNewGameRequest();
        }}
        onViewLeaderboard={() => {
          setShowVictoryModal(false);
          onNavigateTab('leaderboard');
        }}
        onViewScoreSheet={() => {
          setShowVictoryModal(false);
          setShowScoreSheet(true);
        }}
        onPhotoUploaded={(_mId, gUrl) => {
          onUpdateMatch({
            ...match,
            googlePhotosUploaded: true,
            googlePhotosUrl: gUrl,
          });
        }}
      />

      {/* Abandon Confirmation Modal */}
      {showAbandonConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-rose-500/50 rounded-2xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-rose-400">
              <div className="w-10 h-10 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-400" />
              </div>
              <div>
                <h3 className="font-display font-bold text-base text-white">Abandon Match?</h3>
                <p className="text-xs text-slate-400">Discard active game progress</p>
              </div>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Discarding will delete this in-progress game and its drafted scores. Your family members&apos; lifetime win/loss statistics will remain unchanged.
            </p>
            <div className="flex items-center justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowAbandonConfirm(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
              >
                Keep Playing
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowAbandonConfirm(false);
                  onAbandonMatch();
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-md shadow-rose-950 transition-colors"
              >
                Discard Match
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
