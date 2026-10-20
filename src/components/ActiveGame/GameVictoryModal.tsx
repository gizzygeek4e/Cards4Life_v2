import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Award, RotateCcw, BarChart2, Star, Camera, Check, ExternalLink, AlertCircle } from 'lucide-react';
import { GameMatch, Player } from '../../types';
import { soundManager } from '../../utils/audio';
import {
  initAuth,
  googleSignIn,
  uploadMatchPhotoToGooglePhotos,
  getCachedAccessToken,
} from '../../utils/googlePhotos';
import { User } from 'firebase/auth';

interface GameVictoryModalProps {
  isOpen: boolean;
  match: GameMatch;
  players: Player[];
  onPlayAgain: () => void;
  onViewLeaderboard: () => void;
  onViewScoreSheet: () => void;
  onPhotoUploaded?: (matchId: string, googlePhotosUrl?: string) => void;
}

export const GameVictoryModal: React.FC<GameVictoryModalProps> = ({
  isOpen,
  match,
  players,
  onPlayAgain,
  onViewLeaderboard,
  onViewScoreSheet,
  onPhotoUploaded,
}) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadSuccess, setUploadSuccess] = useState<boolean>(Boolean(match.googlePhotosUploaded));
  const [googlePhotosUrl, setGooglePhotosUrl] = useState<string | null>(match.googlePhotosUrl || null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setCurrentUser(user);
        // If photo exists and hasn't been uploaded yet, auto-upload
        if (match.photoUrl && !match.googlePhotosUploaded && !uploadSuccess && token) {
          handleUpload(token);
        }
      },
      () => setCurrentUser(null)
    );
    return () => unsubscribe();
  }, [isOpen, match.photoUrl]);

  useEffect(() => {
    if (isOpen) {
      soundManager.playVictoryFanfare();

      // Confetti burst sequence
      const duration = 2.5 * 1000;
      const end = Date.now() + duration;

      const frame = () => {
        confetti({
          particleCount: 4,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#ffffff'],
        });
        confetti({
          particleCount: 4,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#ffffff'],
        });

        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Calculate totals and rankings
  const totals: Record<string, number> = {};
  const zeroCounts: Record<string, number> = {};
  match.playerIds.forEach((pid) => {
    totals[pid] = 0;
    zeroCounts[pid] = 0;
  });

  match.rounds.forEach((round) => {
    match.playerIds.forEach((pid) => {
      const sc = round.scores[pid];
      if (sc) {
        totals[pid] = (totals[pid] || 0) + sc.score;
        if (sc.score === 0 || sc.isRoundWinner) {
          zeroCounts[pid] = (zeroCounts[pid] || 0) + 1;
        }
      }
    });
  });

  const sortedPlayerIds = [...match.playerIds].sort((a, b) => {
    const scA = totals[a] ?? 0;
    const scB = totals[b] ?? 0;
    return match.winningCondition === 'LOWEST_SCORE' ? scA - scB : scB - scA;
  });

  const getPlayer = (id: string) => players.find((p) => p.id === id);

  const championId = sortedPlayerIds[0];
  const champion = getPlayer(championId);

  // Find most 0-score round player
  let bestZeroPlayerId = championId;
  let maxZeros = 0;
  Object.entries(zeroCounts).forEach(([pid, count]) => {
    if (count > maxZeros) {
      maxZeros = count;
      bestZeroPlayerId = pid;
    }
  });
  const bestZeroPlayer = getPlayer(bestZeroPlayerId);

  const handleUpload = async (token: string) => {
    if (!match.photoUrl || isUploading) return;
    try {
      setIsUploading(true);
      setUploadError(null);
      const res = await uploadMatchPhotoToGooglePhotos(
        token,
        match.photoUrl,
        match.title,
        champion?.name
      );
      setUploadSuccess(true);
      if (res.productUrl) {
        setGooglePhotosUrl(res.productUrl);
      }
      if (onPhotoUploaded) {
        onPhotoUploaded(match.id, res.productUrl);
      }
    } catch (err: unknown) {
      console.error('Google Photos upload failed:', err);
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setUploadError(msg);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSignInAndUpload = async () => {
    try {
      setUploadError(null);
      const res = await googleSignIn();
      if (res?.accessToken) {
        setCurrentUser(res.user);
        await handleUpload(res.accessToken);
      }
    } catch (err: unknown) {
      console.error('Sign-in failed:', err);
      const msg = err instanceof Error ? err.message : 'Sign-in failed';
      setUploadError(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="bg-slate-900 border border-amber-500/50 rounded-3xl w-full max-w-lg shadow-[0_0_50px_rgba(245,158,11,0.2)] overflow-hidden my-auto animate-in fade-in zoom-in-95">
        {/* Banner with card felt art */}
        <div className="relative p-6 text-center border-b border-amber-500/30 overflow-hidden bg-gradient-to-b from-amber-950/40 via-slate-900 to-slate-900">
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 rounded-full bg-amber-500/20 border-2 border-amber-400 flex items-center justify-center mb-3 shadow-[0_0_20px_rgba(245,158,11,0.4)] animate-bounce">
              <Trophy className="w-9 h-9 text-amber-400" />
            </div>

            <p className="text-xs uppercase font-extrabold tracking-widest text-amber-400">
              Match Championship Concluded
            </p>
            <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-white mt-1">
              {champion?.name} Takes the Win!
            </h2>
            <p className="text-xs text-slate-300 mt-1">
              Finished with{' '}
              <strong className="text-amber-300 font-bold tabular-nums">{totals[championId]} points</strong> across{' '}
              {match.rounds.length} rounds.
            </p>
          </div>
        </div>

        {/* Podium Top 3 */}
        <div className="p-5 space-y-4">
          <div className="flex items-end justify-center gap-2 sm:gap-3 pt-2 pb-1">
            {/* 2nd Place */}
            {sortedPlayerIds[1] && (
              <div className="flex-1 flex flex-col items-center text-center">
                <div className="text-2xl mb-1">{getPlayer(sortedPlayerIds[1])?.avatar}</div>
                <div className="w-full bg-slate-800/80 border border-slate-700 rounded-t-2xl p-2.5 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">2nd Place</span>
                  <p className="text-xs font-bold text-white truncate max-w-full">
                    {getPlayer(sortedPlayerIds[1])?.name}
                  </p>
                  <p className="font-display text-sm font-extrabold text-slate-300 tabular-nums mt-0.5">
                    {totals[sortedPlayerIds[1]]} pts
                  </p>
                </div>
              </div>
            )}

            {/* 1st Place */}
            {sortedPlayerIds[0] && (
              <div className="flex-1 flex flex-col items-center text-center -mt-3">
                <div className="relative mb-1">
                  <span className="text-3xl">{champion?.avatar}</span>
                  <span className="absolute -top-3 -right-2 text-lg">👑</span>
                </div>
                <div className="w-full bg-amber-950/40 border-2 border-amber-400/80 rounded-t-2xl p-3 flex flex-col items-center shadow-lg shadow-amber-950/50">
                  <span className="text-[10px] font-black text-amber-400 uppercase tracking-wider">Champion</span>
                  <p className="text-xs font-bold text-white truncate max-w-full">
                    {champion?.name}
                  </p>
                  <p className="font-display text-base font-black text-amber-300 tabular-nums mt-0.5">
                    {totals[championId]} pts
                  </p>
                </div>
              </div>
            )}

            {/* 3rd Place */}
            {sortedPlayerIds[2] && (
              <div className="flex-1 flex flex-col items-center text-center">
                <div className="text-2xl mb-1">{getPlayer(sortedPlayerIds[2])?.avatar}</div>
                <div className="w-full bg-slate-800/60 border border-slate-700/80 rounded-t-2xl p-2.5 flex flex-col items-center">
                  <span className="text-[10px] font-bold text-amber-700 uppercase">3rd Place</span>
                  <p className="text-xs font-bold text-white truncate max-w-full">
                    {getPlayer(sortedPlayerIds[2])?.name}
                  </p>
                  <p className="font-display text-sm font-extrabold text-slate-300 tabular-nums mt-0.5">
                    {totals[sortedPlayerIds[2]]} pts
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Highlights */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 shrink-0" />
              <div className="truncate">
                <p className="text-[10px] text-slate-400">Joker 0-Point Specialist</p>
                <p className="font-semibold text-white truncate">
                  {bestZeroPlayer?.name} ({maxZeros} rounds)
                </p>
              </div>
            </div>

            <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-400 shrink-0" />
              <div className="truncate">
                <p className="text-[10px] text-slate-400">Lifetime Stats</p>
                <p className="font-semibold text-emerald-400 truncate">Saved to Leaderboard</p>
              </div>
            </div>
          </div>

          {/* Match Photo & Google Photos Sync Card */}
          {match.photoUrl && (
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Match Celebration Photo</span>
                </div>
                {uploadSuccess && (
                  <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 border border-emerald-500/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Synced to Google Photos
                  </span>
                )}
              </div>

              <div className="flex items-center gap-3">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-900 border border-slate-700 shrink-0 shadow-md">
                  <img
                    src={match.photoUrl}
                    alt="Match celebration"
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="flex-1 min-w-0 space-y-2">
                  {uploadSuccess ? (
                    <div>
                      <p className="text-xs font-semibold text-emerald-300">
                        Saved in Google Photos!
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Album: <strong>Cards 4 Life - Family Matches</strong>
                      </p>
                      {googlePhotosUrl && (
                        <a
                          href={googlePhotosUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-400 hover:text-amber-300 underline mt-1"
                        >
                          <span>Open in Google Photos</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-medium text-slate-300">
                        Add this photo to your family Google Photos album:
                      </p>

                      {uploadError && (
                        <p className="text-[10px] text-rose-400 flex items-center gap-1 mt-0.5">
                          <AlertCircle className="w-3 h-3" />
                          {uploadError}
                        </p>
                      )}

                      <div className="pt-1">
                        {currentUser ? (
                          <button
                            type="button"
                            disabled={isUploading}
                            onClick={() => {
                              const token = getCachedAccessToken();
                              if (token) handleUpload(token);
                              else handleSignInAndUpload();
                            }}
                            className="touch-btn min-h-[38px] px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-amber-950 transition-all disabled:opacity-50"
                          >
                            {isUploading ? (
                              <>
                                <span className="animate-spin text-xs">⏳</span>
                                <span>Uploading to Google Photos...</span>
                              </>
                            ) : (
                              <>
                                <Camera className="w-3.5 h-3.5" />
                                <span>Save to Google Photos Album</span>
                              </>
                            )}
                          </button>
                        ) : (
                          <button
                            type="button"
                            disabled={isUploading}
                            onClick={handleSignInAndUpload}
                            className="touch-btn min-h-[38px] px-3 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center gap-2 shadow-md transition-all disabled:opacity-50"
                          >
                            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                            </svg>
                            <span>{isUploading ? 'Connecting...' : 'Sign in to sync with Google Photos'}</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="p-4 bg-slate-950/80 border-t border-slate-800 flex flex-col sm:flex-row gap-2">
          <button
            type="button"
            onClick={onViewScoreSheet}
            className="flex-1 min-h-[44px] py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <BarChart2 className="w-4 h-4" />
            <span>Score Sheet</span>
          </button>

          <button
            type="button"
            onClick={onViewLeaderboard}
            className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
          >
            <Trophy className="w-4 h-4 text-amber-400" />
            <span>Leaderboard</span>
          </button>

          <button
            type="button"
            onClick={onPlayAgain}
            className="flex-1 min-h-[44px] py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-950 transition-all active:scale-98"
          >
            <RotateCcw className="w-4 h-4" />
            <span>New Match</span>
          </button>
        </div>
      </div>
    </div>
  );
};
