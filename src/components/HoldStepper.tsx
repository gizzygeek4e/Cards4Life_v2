import React, { useRef, useState, useEffect } from 'react';
import { Plus, Minus, RotateCcw, Edit2 } from 'lucide-react';
import { soundManager } from '../utils/audio';

interface HoldStepperProps {
  value: number;
  onChange: (newValue: number) => void;
  disabled?: boolean;
  min?: number;
  max?: number;
  allowNegative?: boolean;
  showCardChips?: boolean;
  onWentOut?: () => void;
  isWinner?: boolean;
}

export const HoldStepper: React.FC<HoldStepperProps> = ({
  value,
  onChange,
  disabled = false,
  min = 0,
  max = 9999,
  allowNegative = false,
  showCardChips = true,
  onWentOut,
  isWinner = false,
}) => {
  const [speedLevel, setSpeedLevel] = useState<number>(1);
  const [isPressing, setIsPressing] = useState<'plus' | 'minus' | null>(null);
  const [showManualInput, setShowManualInput] = useState<boolean>(false);
  const [manualText, setManualText] = useState<string>(String(value));

  const timerRef = useRef<number | null>(null);
  const holdStartRef = useRef<number>(0);
  const currentValRef = useRef<number>(value);

  // Sync ref
  useEffect(() => {
    currentValRef.current = value;
    setManualText(String(value));
  }, [value]);

  const updateValue = (delta: number, currentSpeed: number) => {
    const raw = currentValRef.current + delta;
    const effectiveMin = allowNegative ? -9999 : min;
    const clamped = Math.max(effectiveMin, Math.min(max, raw));
    if (clamped !== currentValRef.current) {
      currentValRef.current = clamped;
      onChange(clamped);
      soundManager.playStep(delta > 0, currentSpeed);
    }
  };

  const startHold = (direction: 'plus' | 'minus') => {
    if (disabled || isWinner) return;

    setIsPressing(direction);
    holdStartRef.current = Date.now();
    setSpeedLevel(1);

    // Initial immediate step
    const initialStep = 1;
    updateValue(direction === 'plus' ? initialStep : -initialStep, 1);

    // Schedule repeating accelerated intervals
    const scheduleNext = () => {
      const elapsed = Date.now() - holdStartRef.current;
      let intervalMs = 150;
      let step = 1;
      let lvl = 1;

      if (elapsed > 4000) {
        step = 25;
        intervalMs = 50;
        lvl = 4;
      } else if (elapsed > 2200) {
        step = 10;
        intervalMs = 70;
        lvl = 3;
      } else if (elapsed > 900) {
        step = 5;
        intervalMs = 100;
        lvl = 2;
      } else if (elapsed > 350) {
        step = 1;
        intervalMs = 140;
        lvl = 1;
      }

      setSpeedLevel(lvl);
      updateValue(direction === 'plus' ? step : -step, lvl);
      timerRef.current = window.setTimeout(scheduleNext, intervalMs);
    };

    // First wait before rapid firing
    timerRef.current = window.setTimeout(scheduleNext, 320);
  };

  const stopHold = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressing(null);
    setSpeedLevel(1);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseInt(manualText, 10);
    if (!isNaN(parsed)) {
      const effectiveMin = allowNegative ? -9999 : min;
      onChange(Math.max(effectiveMin, Math.min(max, parsed)));
    }
    setShowManualInput(false);
  };

  return (
    <div className="flex flex-col gap-2 w-full">
      {/* Main stepper row */}
      <div className="flex items-center justify-between gap-2 bg-slate-900/90 border border-slate-800 rounded-2xl p-1.5 shadow-inner">
        {/* Minus button */}
        <button
          type="button"
          disabled={disabled || isWinner || (!allowNegative && value <= min)}
          onPointerDown={() => startHold('minus')}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          className={`touch-btn relative flex items-center justify-center min-w-[52px] min-h-[52px] h-13 w-13 rounded-xl transition-all duration-100 ${
            disabled || isWinner || (!allowNegative && value <= min)
              ? 'opacity-30 text-slate-600 bg-slate-950/40 cursor-not-allowed'
              : isPressing === 'minus'
              ? 'bg-rose-600/30 text-rose-300 scale-95 border border-rose-500/40'
              : 'bg-[#0c1c30] hover:bg-rose-950/30 active:bg-rose-900/40 text-slate-200 border border-[#1b385e] hover:border-rose-800/40'
          }`}
          aria-label="Decrease score (hold to accelerate)"
        >
          <Minus className="w-6 h-6 stroke-[2.5]" />
        </button>

        {/* Score Display (tap to edit) */}
        <div
          onClick={() => !disabled && !isWinner && setShowManualInput(true)}
          className={`flex-1 flex flex-col items-center justify-center py-1 cursor-pointer rounded-xl hover:bg-[#0c1c30]/60 transition-colors ${
            isWinner ? 'opacity-90' : ''
          }`}
          title="Tap to type score"
        >
          <div className="flex items-baseline gap-1">
            <span
              className={`font-display text-3xl font-extrabold tracking-tight tabular-nums transition-all ${
                isWinner
                  ? 'text-amber-400 drop-shadow-[0_0_12px_rgba(217,155,38,0.5)]'
                  : value > 0
                  ? 'text-white'
                  : 'text-blue-300/50'
              }`}
            >
              {value}
            </span>
            <span className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider">
              {value === 1 ? 'pt' : 'pts'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 h-4">
            {isWinner ? (
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                Preserved 0
              </span>
            ) : isPressing ? (
              <span className="text-[10px] font-bold text-amber-300 tabular-nums animate-pulse">
                {speedLevel === 1 ? 'Hold (+1)' : speedLevel === 2 ? '⚡ +5' : speedLevel === 3 ? '⚡⚡ +10' : '🔥 MAX +25'}
              </span>
            ) : (
              <span className="text-[10px] text-blue-300/70 flex items-center gap-0.5 opacity-70">
                <Edit2 className="w-2.5 h-2.5" /> Tap to type
              </span>
            )}
          </div>
        </div>

        {/* Plus button */}
        <button
          type="button"
          disabled={disabled || isWinner || value >= max}
          onPointerDown={() => startHold('plus')}
          onPointerUp={stopHold}
          onPointerLeave={stopHold}
          onPointerCancel={stopHold}
          className={`touch-btn relative flex items-center justify-center min-w-[52px] min-h-[52px] h-13 w-13 rounded-xl transition-all duration-100 ${
            disabled || isWinner || value >= max
              ? 'opacity-30 text-slate-600 bg-slate-950/40 cursor-not-allowed'
              : isPressing === 'plus'
              ? 'bg-blue-600/40 text-blue-200 scale-95 border border-blue-400/60'
              : 'bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-md shadow-blue-950/80 border border-blue-400/40'
          }`}
          aria-label="Increase score (hold to accelerate)"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>

      {/* Quick-add chips for card values (Joker 50, Ace 20, Face 10, Num 5) */}
      {showCardChips && !isWinner && !disabled && (
        <div className="flex items-center justify-between gap-1.5 pt-0.5">
          <button
            type="button"
            onClick={() => updateValue(5, 1)}
            className="touch-btn flex-1 min-h-[38px] py-1.5 text-xs font-semibold text-blue-200 bg-[#0e223d] hover:bg-[#143154] active:scale-95 border border-[#1e3e6b] rounded-lg transition-transform tabular-nums"
          >
            +5
          </button>
          <button
            type="button"
            onClick={() => updateValue(10, 1)}
            className="touch-btn flex-1 min-h-[38px] py-1.5 text-xs font-semibold text-blue-300 bg-[#0c2242] hover:bg-[#12305a] active:scale-95 border border-blue-500/40 rounded-lg transition-transform tabular-nums"
            title="Face cards (J, Q, K = 10 pts)"
          >
            +10
          </button>
          <button
            type="button"
            onClick={() => updateValue(20, 2)}
            className="touch-btn flex-1 min-h-[38px] py-1.5 text-xs font-semibold text-rose-300 bg-[#25101a] hover:bg-[#341524] active:scale-95 border border-rose-500/40 rounded-lg transition-transform tabular-nums"
            title="Ace (20 pts)"
          >
            +20
          </button>
          <button
            type="button"
            onClick={() => updateValue(50, 3)}
            className="touch-btn flex-1 min-h-[38px] py-1.5 text-xs font-bold text-amber-300 bg-[#281a0c] hover:bg-[#3a2512] active:scale-95 border border-amber-500/50 rounded-lg transition-transform tabular-nums"
            title="Joker (50 pts penalty!)"
          >
            +50
          </button>
          <button
            type="button"
            onClick={() => {
              onChange(0);
              soundManager.playStep(false, 1);
            }}
            className="touch-btn min-h-[38px] px-2.5 py-1.5 text-xs font-medium text-blue-300/80 hover:text-white bg-[#0c1c30] hover:bg-[#122844] active:scale-95 border border-[#1b385e] rounded-lg transition-transform flex items-center gap-1"
            title="Reset score to 0"
          >
            <RotateCcw className="w-3 h-3 text-amber-400" />
            <span>0</span>
          </button>
        </div>
      )}

      {/* Manual Input Dialog */}
      {showManualInput && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-5 w-full max-w-xs shadow-2xl animate-in fade-in zoom-in-95">
            <h4 className="text-base font-bold text-white mb-1">Enter Exact Score</h4>
            <p className="text-xs text-slate-400 mb-4">Type the points total for this round:</p>

            <form onSubmit={handleManualSubmit} className="space-y-4">
              <input
                type="number"
                pattern="[0-9]*"
                autoFocus
                value={manualText}
                onChange={(e) => setManualText(e.target.value)}
                className="w-full text-center text-3xl font-display font-bold py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-amber-400"
              />

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualInput(false)}
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-slate-700 text-slate-300 font-medium text-sm hover:bg-slate-800 active:scale-98 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-500 border border-blue-400/40 text-white font-bold text-sm active:scale-98 transition-colors shadow-lg shadow-blue-950"
                >
                  Set Score
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
