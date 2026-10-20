import React from 'react';
import { X, HardDrive, ShieldCheck, RefreshCw, Bookmark, Trophy, Database, Download } from 'lucide-react';

interface StorageInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateLeaderboard?: () => void;
}

export const StorageInfoModal: React.FC<StorageInfoModalProps> = ({
  isOpen,
  onClose,
  onNavigateLeaderboard,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-slate-900 border border-emerald-800/60 rounded-3xl w-full max-w-lg p-5 sm:p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-950/70 border border-emerald-500/40 flex items-center justify-center shrink-0">
              <Database className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-white">Where Is Your Data Stored?</h2>
              <p className="text-xs text-slate-400">Offline-first persistent device storage</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-4 text-xs leading-relaxed text-slate-300">
          {/* Card 1: Local Storage */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <HardDrive className="w-4 h-4" />
              <span>1. Stored Securely on Your Device (localStorage)</span>
            </div>
            <p className="text-slate-300">
              All your player profiles, in-progress matches, game drafts, and lifetime family statistics are saved directly in your device&apos;s browser storage (<code className="text-amber-400 font-mono text-[11px] bg-slate-900 px-1.5 py-0.5 rounded">localStorage</code>).
            </p>
            <div className="flex items-center gap-1.5 text-[11px] text-emerald-300 font-semibold pt-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Private · Zero server tracking · Works completely offline</span>
            </div>
          </div>

          {/* Card 2: Automatic Real-Time Auto-Save */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <RefreshCw className="w-4 h-4" />
              <span>2. Real-Time Auto-Save</span>
            </div>
            <p className="text-slate-300">
              The scorekeeper automatically writes to storage on <strong className="text-white">every single tap</strong> (+/- points stepper, marking a round winner, and round finalisations). If you close your phone, lock the screen, or refresh the page, your game draft is instantly preserved.
            </p>
          </div>

          {/* Card 3: Drafts vs Completed Matches */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2.5">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-sm">
              <Bookmark className="w-4 h-4" />
              <span>3. How Drafts & Abandon Work</span>
            </div>
            <ul className="space-y-2 text-slate-300 pl-1">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">💾 Save & Pause:</span>
                <span>Puts your current match into the <strong className="text-white">Saved Drafts</strong> list so you can take a break or start another game. You can resume it anytime with full round scores intact.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">🗑️ Abandon Match:</span>
                <span>Safely discards this active game draft without modifying or penalizing your family members&apos; lifetime win/loss statistics or streaks.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">🏆 Finalize Match:</span>
                <span>Once the final round is completed, the game is archived to <strong className="text-white">Match History</strong> and permanently credits victories and streaks to the family leaderboard.</span>
              </li>
            </ul>
          </div>

          {/* Card 4: Backup & Device Transfer */}
          <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-2">
            <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
              <Download className="w-4 h-4" />
              <span>4. Data Backup & Multi-Device Transfer</span>
            </div>
            <p className="text-slate-300">
              Want to move your family game history to another phone or computer? Visit the <strong className="text-white">Leaderboard</strong> tab to download a complete JSON backup file or copy your game data with 1 click.
            </p>
            {onNavigateLeaderboard && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNavigateLeaderboard();
                }}
                className="mt-1 text-xs font-semibold text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors"
              >
                <span>Go to Backup / Restore on Leaderboard →</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
