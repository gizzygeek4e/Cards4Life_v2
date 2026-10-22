import React, { useState, useRef } from 'react';
import { X, Sparkles, Check, ArrowRight, Dices, Layers, Camera, Image as ImageIcon, Trash2 } from 'lucide-react';
import { GameMatch, GameMode, Player, WinningCondition, AMERICAN_JOKER_ROUNDS } from '../../types';
import { processImageFile } from '../../utils/imageUtils';
import fourieFamilyLogo from '../../assets/images/fourie_family_logo.jpeg';

interface GameSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  players: Player[];
  onStartGame: (match: GameMatch) => void;
  onManagePlayers: () => void;
}

export const GameSetupModal: React.FC<GameSetupModalProps> = ({
  isOpen,
  onClose,
  players,
  onStartGame,
  onManagePlayers,
}) => {
  const [mode, setMode] = useState<GameMode>('AMERICAN_JOKER');
  const [title, setTitle] = useState<string>('Friday Night Joker');
  const [winningCondition, setWinningCondition] = useState<WinningCondition>('LOWEST_SCORE');
  const [selectedPlayerIds, setSelectedPlayerIds] = useState<string[]>(
    players.slice(0, 4).map((p) => p.id)
  );
  const [dealerIndex, setDealerIndex] = useState<number>(0);
  const [standardRounds, setStandardRounds] = useState<number>(5);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const togglePlayer = (id: string) => {
    if (selectedPlayerIds.includes(id)) {
      if (selectedPlayerIds.length <= 2) return; // Keep at least 2
      setSelectedPlayerIds(selectedPlayerIds.filter((p) => p !== id));
      if (dealerIndex >= selectedPlayerIds.length - 1) {
        setDealerIndex(0);
      }
    } else {
      setSelectedPlayerIds([...selectedPlayerIds, id]);
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessingPhoto(true);
      const processed = await processImageFile(file, 1280, 0.85);
      setPhotoUrl(processed);
    } catch (err) {
      console.error('Failed to process image:', err);
      alert('Could not process this image. Please select another photo.');
    } finally {
      setIsProcessingPhoto(false);
    }
  };

  const handleStart = () => {
    if (selectedPlayerIds.length < 2) return;

    const maxRounds = mode === 'AMERICAN_JOKER' ? 5 : standardRounds;

    // Build empty initial round structure
    const initialRounds = Array.from({ length: maxRounds }).map((_, idx) => {
      const roundNum = idx + 1;
      const roundName =
        mode === 'AMERICAN_JOKER'
          ? AMERICAN_JOKER_ROUNDS[idx]?.name || `Round ${roundNum}`
          : `Round ${roundNum}`;
      const description =
        mode === 'AMERICAN_JOKER'
          ? AMERICAN_JOKER_ROUNDS[idx]?.contract
          : undefined;

      const dealerForRound = selectedPlayerIds[(dealerIndex + idx) % selectedPlayerIds.length];

      const initialScores: Record<string, { playerId: string; score: number; isRoundWinner: boolean }> = {};
      selectedPlayerIds.forEach((pid) => {
        initialScores[pid] = {
          playerId: pid,
          score: 0,
          isRoundWinner: false,
        };
      });

      return {
        roundNumber: roundNum,
        name: roundName,
        description,
        scores: initialScores,
        dealerPlayerId: dealerForRound,
      };
    });

    const newMatch: GameMatch = {
      id: `match_${Date.now()}`,
      title: title.trim() || (mode === 'AMERICAN_JOKER' ? 'American Joker 5-Round' : 'Standard Card Match'),
      mode,
      winningCondition: mode === 'AMERICAN_JOKER' ? 'LOWEST_SCORE' : winningCondition,
      maxRounds,
      playerIds: selectedPlayerIds,
      currentRoundIndex: 0,
      rounds: initialRounds,
      startedAt: Date.now(),
      status: 'IN_PROGRESS',
      photoUrl: photoUrl || undefined,
    };

    onStartGame(newMatch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-[#071322] border border-slate-200 dark:border-[#1b3558] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header with Fourie Family Crest Feature */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[#1b3558] bg-slate-50 dark:bg-gradient-to-r dark:from-[#0d223d] dark:via-[#091a2f] dark:to-[#071322]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden border-2 border-amber-500 dark:border-amber-400 shadow-md shrink-0 bg-[#071322]">
              <img src={fourieFamilyLogo} alt="Fourie Family Crest" className="w-full h-full object-cover" />
            </div>
            <div>
              <h3 className="font-heraldic font-black text-base text-slate-900 dark:text-white tracking-tight">
                Start New Match
              </h3>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold uppercase tracking-wider font-display">
                Fourie Family · Table Roster
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-[#122844] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Game Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Match Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunday Family Showdown"
              className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 dark:focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Match Photo Upload Area */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                Match Photo (Optional)
              </label>
              <span className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                Syncs to Google Photos
              </span>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept="image/*"
              className="hidden"
              onChange={handlePhotoSelect}
            />

            {photoUrl ? (
              <div className="relative rounded-2xl overflow-hidden border border-amber-500/60 dark:border-amber-400/60 bg-amber-50/50 dark:bg-[#0a1a2e] p-2 flex items-center gap-3">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 dark:bg-[#071322] shrink-0 border border-amber-400/50">
                  <img
                    src={photoUrl}
                    alt="Match Preview"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white truncate">Match photo attached</p>
                  <p className="text-[11px] text-amber-700 dark:text-amber-300">
                    Ready to save to Google Photos album on match completion
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-[#142d4d] hover:bg-slate-100 dark:hover:bg-[#1b3d69] text-xs text-slate-700 dark:text-blue-100 border border-slate-200 dark:border-transparent transition-colors"
                  >
                    Change
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoUrl(null)}
                    className="p-1.5 rounded-lg bg-white dark:bg-[#142d4d] hover:bg-rose-50 dark:hover:bg-rose-900/40 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 border border-slate-200 dark:border-transparent transition-colors"
                    title="Remove photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                disabled={isProcessingPhoto}
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-3.5 rounded-2xl border-2 border-dashed border-slate-300 dark:border-[#1b385e] hover:border-amber-500 dark:hover:border-amber-400/70 bg-slate-50 hover:bg-slate-100/80 dark:bg-[#0a1b32]/40 dark:hover:bg-[#0a1b32]/80 transition-all flex flex-col items-center justify-center text-center cursor-pointer group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-[#0f2847] group-hover:bg-amber-100 dark:group-hover:bg-amber-400/20 text-slate-600 dark:text-blue-300 group-hover:text-amber-600 dark:group-hover:text-amber-400 flex items-center justify-center mb-2 transition-colors">
                  {isProcessingPhoto ? (
                    <span className="text-xs animate-spin">⏳</span>
                  ) : (
                    <Camera className="w-5 h-5" />
                  )}
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white">
                  {isProcessingPhoto ? 'Processing photo...' : 'Take or upload match photo'}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-blue-300/70 mt-0.5">
                  Snap the card table or family players before dealing!
                </span>
              </button>
            )}
          </div>

          {/* Game Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
              Game Mode
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* American Joker Mode */}
              <div
                onClick={() => {
                  setMode('AMERICAN_JOKER');
                  setWinningCondition('LOWEST_SCORE');
                }}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  mode === 'AMERICAN_JOKER'
                    ? 'bg-amber-50 dark:bg-[#0e2544] border-amber-500 dark:border-amber-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-[#09182b] border-slate-200 dark:border-[#162e4e] hover:border-slate-300 dark:hover:border-[#204370] opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display font-bold text-sm text-amber-600 dark:text-amber-300 flex items-center gap-1.5">
                    🃏 American Joker
                  </span>
                  {mode === 'AMERICAN_JOKER' && (
                    <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 border border-amber-300 dark:border-amber-500/40">
                      5 Rounds
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-blue-200/80 leading-relaxed">
                  3 to 7 cards dealt across 5 rounds. Winner goes out with preserved 0 points! Lowest penalty score wins.
                </p>
              </div>

              {/* Standard Total Points */}
              <div
                onClick={() => setMode('STANDARD_POINTS')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  mode === 'STANDARD_POINTS'
                    ? 'bg-blue-50 dark:bg-[#0e2544] border-blue-500 dark:border-amber-400 shadow-sm'
                    : 'bg-slate-50 dark:bg-[#09182b] border-slate-200 dark:border-[#162e4e] hover:border-slate-300 dark:hover:border-[#204370] opacity-80'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600 dark:text-blue-400" /> Standard Points
                  </span>
                  {mode === 'STANDARD_POINTS' && (
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-300 px-1.5 py-0.5 rounded bg-blue-100 dark:bg-blue-950/60 border border-blue-300 dark:border-blue-500/40">
                      Flexible
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-blue-200/80 leading-relaxed">
                  Custom number of rounds. Configurable high or low score wins, positive & negative points.
                </p>
              </div>
            </div>
          </div>

          {/* Standard points options */}
          {mode === 'STANDARD_POINTS' && (
            <div className="bg-slate-50 dark:bg-[#09182b] border border-slate-200 dark:border-[#1b385e] rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Number of Rounds</span>
                <div className="flex items-center gap-1">
                  {[3, 5, 7, 10].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setStandardRounds(r)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                        standardRounds === r
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'bg-white dark:bg-[#0c1c30] text-slate-700 dark:text-blue-200 border border-slate-200 dark:border-transparent hover:bg-slate-100'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-[#1b3558]">
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">Winning Condition</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setWinningCondition('LOWEST_SCORE')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                      winningCondition === 'LOWEST_SCORE'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-white dark:bg-[#0c1c30] text-slate-700 dark:text-blue-200 border border-slate-200 dark:border-transparent hover:bg-slate-100'
                    }`}
                  >
                    Lowest Score
                  </button>
                  <button
                    type="button"
                    onClick={() => setWinningCondition('HIGHEST_SCORE')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                      winningCondition === 'HIGHEST_SCORE'
                        ? 'bg-blue-600 text-white font-bold'
                        : 'bg-white dark:bg-[#0c1c30] text-slate-700 dark:text-blue-200 border border-slate-200 dark:border-transparent hover:bg-slate-100'
                    }`}
                  >
                    Highest Score
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Player Roster Selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                Select Active Players ({selectedPlayerIds.length})
              </label>
              <button
                type="button"
                onClick={onManagePlayers}
                className="text-xs text-amber-600 dark:text-amber-400 hover:text-amber-700 dark:hover:text-amber-300 font-medium underline-offset-2 hover:underline"
              >
                + Add / Edit Profiles
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {players.map((p) => {
                const isSelected = selectedPlayerIds.includes(p.id);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => togglePlayer(p.id)}
                    className={`touch-btn flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'bg-amber-50/70 dark:bg-[#0e2444] border-amber-500 dark:border-amber-400 shadow-sm'
                        : 'bg-slate-50 dark:bg-[#071322] border-slate-200 dark:border-[#162e4e] text-slate-400 opacity-70'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">{p.avatar}</span>
                      <div className="truncate">
                        <p className={`text-xs font-semibold truncate ${isSelected ? 'text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                          {p.name}
                        </p>
                        <p className="text-[10px] text-slate-500 dark:text-blue-300/70 truncate">{p.nickname}</p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-amber-400 border-amber-300 text-slate-950'
                          : 'border-slate-300 dark:border-[#1b3558]'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedPlayerIds.length < 2 && (
              <p className="text-xs text-rose-500 dark:text-rose-400 mt-1">Please select at least 2 players to play.</p>
            )}
          </div>

          {/* First Dealer Selection */}
          {selectedPlayerIds.length >= 2 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                Round 1 Dealer (Rotates Clockwise)
              </label>
              <div className="flex gap-2 overflow-x-auto pb-1">
                {selectedPlayerIds.map((pid, idx) => {
                  const p = players.find((pl) => pl.id === pid);
                  if (!p) return null;
                  const isDealer = dealerIndex === idx;

                  return (
                    <button
                      key={pid}
                      type="button"
                      onClick={() => setDealerIndex(idx)}
                      className={`touch-btn shrink-0 px-3 py-1.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
                        isDealer
                          ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold shadow-md'
                          : 'bg-slate-50 dark:bg-[#071322] border-slate-200 dark:border-[#1b3558] text-slate-700 dark:text-blue-200 hover:border-slate-400 dark:hover:border-blue-400/40'
                      }`}
                    >
                      <span>{p.avatar}</span>
                      <span>{p.name}</span>
                      {isDealer && <span className="text-[10px] px-1 bg-slate-950 text-amber-300 rounded font-bold">D</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-50 dark:bg-[#071322] border-t border-slate-100 dark:border-[#1b3558] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-blue-200 hover:text-slate-900 dark:hover:text-white text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={selectedPlayerIds.length < 2}
            onClick={handleStart}
            className="touch-btn min-h-[44px] px-5 py-2.5 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-500 border border-blue-400/40 disabled:opacity-40 text-white font-bold text-sm rounded-xl shadow-md shadow-blue-950/20 flex items-center gap-2 active:scale-98 transition-all"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Deal & Start</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
