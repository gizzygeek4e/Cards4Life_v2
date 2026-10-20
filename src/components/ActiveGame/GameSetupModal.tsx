import React, { useState } from 'react';
import { X, Sparkles, Check, ArrowRight, Dices, Layers } from 'lucide-react';
import { GameMatch, GameMode, Player, WinningCondition, AMERICAN_JOKER_ROUNDS } from '../../types';

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
    };

    onStartGame(newMatch);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <Dices className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-display font-bold text-base text-white">Start New Match</h3>
              <p className="text-xs text-slate-400">Configure game mode and active roster</p>
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

        {/* Form Body */}
        <div className="p-5 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Game Title */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
              Match Name
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Sunday Family Showdown"
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
            />
          </div>

          {/* Game Mode Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
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
                    ? 'bg-emerald-950/40 border-amber-400 shadow-md shadow-emerald-950'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display font-bold text-sm text-amber-300 flex items-center gap-1.5">
                    🃏 American Joker
                  </span>
                  {mode === 'AMERICAN_JOKER' && (
                    <span className="text-[10px] font-bold text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-900/40 border border-emerald-500/30">
                      5 Rounds
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  3 to 7 cards dealt across 5 rounds. Winner goes out with preserved 0 points! Lowest penalty score wins.
                </p>
              </div>

              {/* Standard Total Points */}
              <div
                onClick={() => setMode('STANDARD_POINTS')}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  mode === 'STANDARD_POINTS'
                    ? 'bg-emerald-950/40 border-amber-400 shadow-md shadow-emerald-950'
                    : 'bg-slate-950/50 border-slate-800 hover:border-slate-700 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-sky-400" /> Standard Points
                  </span>
                  {mode === 'STANDARD_POINTS' && (
                    <span className="text-[10px] font-bold text-sky-400 px-1.5 py-0.5 rounded bg-sky-900/40 border border-sky-500/30">
                      Flexible
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Custom number of rounds. Configurable high or low score wins, positive & negative points.
                </p>
              </div>
            </div>
          </div>

          {/* Standard points options */}
          {mode === 'STANDARD_POINTS' && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-300">Number of Rounds</span>
                <div className="flex items-center gap-1">
                  {[3, 5, 7, 10].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setStandardRounds(r)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-colors ${
                        standardRounds === r
                          ? 'bg-amber-400 text-slate-950 font-bold'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-800/80">
                <span className="text-xs font-medium text-slate-300">Winning Condition</span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setWinningCondition('LOWEST_SCORE')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                      winningCondition === 'LOWEST_SCORE'
                        ? 'bg-emerald-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    Lowest Score
                  </button>
                  <button
                    type="button"
                    onClick={() => setWinningCondition('HIGHEST_SCORE')}
                    className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-colors ${
                      winningCondition === 'HIGHEST_SCORE'
                        ? 'bg-sky-600 text-white font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
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
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Select Active Players ({selectedPlayerIds.length})
              </label>
              <button
                type="button"
                onClick={onManagePlayers}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium underline-offset-2 hover:underline"
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
                        ? 'bg-slate-800/90 border-emerald-500/70 shadow-sm'
                        : 'bg-slate-950/40 border-slate-800 text-slate-500 opacity-60'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0">{p.avatar}</span>
                      <div className="truncate">
                        <p className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                          {p.name}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">{p.nickname}</p>
                      </div>
                    </div>
                    <div
                      className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-emerald-500 border-emerald-400 text-slate-950'
                          : 'border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              })}
            </div>
            {selectedPlayerIds.length < 2 && (
              <p className="text-xs text-rose-400 mt-1">Please select at least 2 players to play.</p>
            )}
          </div>

          {/* First Dealer Selection */}
          {selectedPlayerIds.length >= 2 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 uppercase tracking-wider">
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
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700'
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
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={selectedPlayerIds.length < 2}
            onClick={handleStart}
            className="touch-btn min-h-[44px] px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 disabled:opacity-40 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950 flex items-center gap-2 active:scale-98 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>Deal & Start</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
