import React, { useState, useEffect } from 'react';
import { X, HardDrive, ShieldCheck, RefreshCw, Bookmark, Trophy, Database, Download, Cloud, Share2, Check, Smartphone, Users } from 'lucide-react';
import fourieFamilyLogo from '../../assets/images/fourie_family_logo.jpeg';
import { subscribeSyncStatus, CloudSyncStatus, DEFAULT_FAMILY_ID } from '../../utils/firestoreSync';

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
  const [copied, setCopied] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<CloudSyncStatus>({
    isConnected: true,
    isSyncing: false,
    familyId: DEFAULT_FAMILY_ID,
    lastSyncedAt: Date.now(),
    currentUser: null,
    error: null,
  });

  useEffect(() => {
    const unsub = subscribeSyncStatus((s) => setSyncStatus(s));
    return () => unsub();
  }, []);

  if (!isOpen) return null;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="bg-[#071322] border-2 border-amber-400/70 rounded-3xl w-full max-w-lg p-5 sm:p-6 space-y-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header with Fourie Family Crest */}
        <div className="flex items-start justify-between gap-3 border-b border-[#1b3558] pb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl overflow-hidden border-2 border-amber-400/90 shadow-[0_0_12px_rgba(217,155,38,0.3)] shrink-0 bg-[#071322]">
              <img src={fourieFamilyLogo} alt="Fourie Family Crest" className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="font-display font-black text-lg text-white">Family Data & Multi-Device Sync</h2>
              <p className="text-xs text-amber-400 font-bold uppercase tracking-wider">Fourie Family · Live Cloud Storage</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#0c1c30] hover:bg-[#122844] text-slate-400 hover:text-white flex items-center justify-center transition-colors shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Cloud Status Banner */}
        <div className="p-3.5 rounded-2xl bg-[#0d223d] border border-amber-400/50 flex items-center justify-between gap-3 shadow-inner">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center w-8 h-8 rounded-xl bg-blue-900/60 border border-blue-400/40 text-amber-300">
              <Cloud className="w-4 h-4 text-amber-400" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-400"></span>
              </span>
            </div>
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Multi-Device Cloud Sync Active</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-full font-mono">
                  LIVE
                </span>
              </p>
              <p className="text-[11px] text-blue-200">
                Connected to Fourie Family Room · All phones stay in sync
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopyLink}
            className="touch-btn shrink-0 px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 border border-blue-400/50 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            title="Copy URL to share with family"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-amber-300" />
                <span className="text-amber-300">Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-amber-300" />
                <span>Share Link</span>
              </>
            )}
          </button>
        </div>

        {/* Content sections */}
        <div className="space-y-4 text-xs leading-relaxed text-blue-100">
          {/* Card 1: Multi-Device Family Access */}
          <div className="p-4 rounded-2xl bg-[#09182b] border border-[#1b385e] space-y-2">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <Smartphone className="w-4 h-4 text-amber-400" />
              <span>1. How Family Members Access & Add Games</span>
            </div>
            <p className="text-blue-100/90">
              Any family member can open this web app on their <strong className="text-white">iPhone, Android phone, iPad, or laptop</strong>. All player profiles, live matches, match history, and scores are automatically synchronized in real-time through Cloud Firestore.
            </p>
            <div className="p-2.5 rounded-xl bg-[#0c1c30] border border-[#1c385f] text-[11px] text-blue-200 flex items-center justify-between gap-2">
              <span className="truncate text-slate-300">
                Share this app with family: <strong className="text-white font-mono">{typeof window !== 'undefined' ? window.location.host : 'Cards 4 Life'}</strong>
              </span>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-amber-400 hover:text-amber-300 font-bold underline shrink-0 cursor-pointer"
              >
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Card 2: Automatic Real-Time Auto-Save & Cloud Sync */}
          <div className="p-4 rounded-2xl bg-[#09182b] border border-[#1b385e] space-y-2">
            <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
              <RefreshCw className="w-4 h-4 text-amber-400" />
              <span>2. Real-Time Auto-Save on Every Tap</span>
            </div>
            <p className="text-blue-100/90">
              The scorekeeper automatically syncs on <strong className="text-white">every single tap</strong> (+/- points stepper, marking a round winner, and round finalisations). If someone closes their phone or locks the screen mid-game, the active draft is saved both in the cloud and on the device.
            </p>
          </div>

          {/* Card 3: Drafts vs Completed Matches */}
          <div className="p-4 rounded-2xl bg-[#09182b] border border-[#1b385e] space-y-2.5">
            <div className="flex items-center gap-2 text-amber-300 font-bold text-sm">
              <Bookmark className="w-4 h-4 text-amber-400" />
              <span>3. How Drafts & Abandon Work</span>
            </div>
            <ul className="space-y-2 text-blue-100/90 pl-1">
              <li className="flex items-start gap-2">
                <span className="text-blue-300 font-bold">💾 Save & Pause:</span>
                <span>Puts your current match into the <strong className="text-white">Saved Drafts</strong> list so anyone can resume it anytime with full round scores intact.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">🗑️ Abandon Match:</span>
                <span>Safely discards an accidental or unfinished game draft without affecting lifetime win/loss statistics or streaks.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-amber-400 font-bold">🏆 Finalize Match:</span>
                <span>Once the 5th round is completed, the game is permanently saved to <strong className="text-white">Match History</strong> and updates the family leaderboard for all devices instantly.</span>
              </li>
            </ul>
          </div>

          {/* Card 4: Offline Resilience */}
          <div className="p-4 rounded-2xl bg-[#09182b] border border-[#1b385e] space-y-2">
            <div className="flex items-center gap-2 text-blue-300 font-bold text-sm">
              <HardDrive className="w-4 h-4 text-amber-400" />
              <span>4. Offline Resilience (Plays Anywhere)</span>
            </div>
            <p className="text-blue-100/90">
              Playing cards while camping or where there&apos;s spotty Wi-Fi? The app automatically keeps a local copy on the device. As soon as you reconnect, all scores sync right back to the family cloud.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-[#1b3558]">
          <div className="text-[11px] text-blue-200/80 flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-amber-400" />
            <span>Fourie Family Cards 4 Life</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-500 border border-blue-400/40 text-white font-bold text-xs rounded-xl shadow-lg shadow-blue-950 transition-colors"
          >
            Got It!
          </button>
        </div>
      </div>
    </div>
  );
};
