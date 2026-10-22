import React, { useState } from 'react';
import { UserPlus, Edit2, Trash2, Trophy, Flame, Target, Award, Sparkles, X, Check } from 'lucide-react';
import { Player, PlayerStats } from '../../types';
import fourieFamilyLogo from '../../assets/images/fourie_family_logo.jpeg';

interface PlayerManagerProps {
  players: Player[];
  stats: Record<string, PlayerStats>;
  onAddPlayer: (name: string, nickname: string, avatar: string, color: string) => void;
  onUpdatePlayer: (player: Player) => void;
  onDeletePlayer: (playerId: string) => void;
  onStartMatchWithPlayers?: (playerIds: string[]) => void;
}

const AVATAR_OPTIONS = ['🦁', '👑', '⚡', '🕊️', '🃏', '🦊', '🐯', '🦅', '🚀', '💎', '🎲', '🎯', '🐱', '🐶', '🦄', '🎩'];

const COLOR_OPTIONS = [
  '#e5a924', // Crest Gold
  '#1d5b96', // Royal Blue
  '#3b82c4', // Cerulean Sky Blue
  '#f3ba3a', // Bright Ochre Gold
  '#dc2626', // Ace of Hearts Ruby Red
  '#0c2340', // Deep Heraldic Navy
  '#60a5fa', // Light Cerulean
  '#fae8b6', // Light Gold Cream
];

export const PlayerManager: React.FC<PlayerManagerProps> = ({
  players,
  stats,
  onAddPlayer,
  onUpdatePlayer,
  onDeletePlayer,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);

  // Form state
  const [name, setName] = useState<string>('');
  const [nickname, setNickname] = useState<string>('');
  const [avatar, setAvatar] = useState<string>('🃏');
  const [color, setColor] = useState<string>('#e5a924');

  const openAddModal = () => {
    setEditingPlayer(null);
    setName('');
    setNickname('The Challenger');
    setAvatar(AVATAR_OPTIONS[Math.floor(Math.random() * AVATAR_OPTIONS.length)]);
    setColor(COLOR_OPTIONS[Math.floor(Math.random() * COLOR_OPTIONS.length)]);
    setIsModalOpen(true);
  };

  const openEditModal = (player: Player) => {
    setEditingPlayer(player);
    setName(player.name);
    setNickname(player.nickname);
    setAvatar(player.avatar);
    setColor(player.color);
    setIsModalOpen(true);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingPlayer) {
      onUpdatePlayer({
        ...editingPlayer,
        name: name.trim(),
        nickname: nickname.trim() || 'Player',
        avatar,
        color,
      });
    } else {
      onAddPlayer(name.trim(), nickname.trim() || 'Rookie', avatar, color);
    }

    setIsModalOpen(false);
  };

  const handleDelete = (id: string, nameStr: string) => {
    if (players.length <= 2) {
      alert('You must keep at least 2 player profiles in the family roster.');
      return;
    }
    if (window.confirm(`Are you sure you want to remove ${nameStr} from the roster?`)) {
      onDeletePlayer(id);
    }
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
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 block font-display">
                FOURIE FAMILY ROSTER
              </span>
              <span className="text-[10px] font-bold text-slate-600 dark:text-amber-300">
                · {players.length} Profiles
              </span>
            </div>
            <h1 className="font-heraldic text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
              Family Member Profiles
            </h1>
            <p className="text-xs text-slate-600 dark:text-blue-200/80 mt-0.5">
              Player cards, personalized crest avatars, and lifetime win/loss statistics
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={openAddModal}
          className="touch-btn min-h-[44px] px-4 py-2 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-500 border border-blue-400/40 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-950/20 flex items-center justify-center gap-2 active:scale-98 transition-all self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4 text-amber-300" />
          <span>Add Family Member</span>
        </button>
      </div>

      {/* Players Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {players.map((player) => {
          const pStats = stats[player.id] || {
            playerId: player.id,
            gamesPlayed: 0,
            gamesWon: 0,
            totalPoints: 0,
            bestRoundScore: 0,
            zeroPointRoundsCount: 0,
            currentStreak: 0,
            bestStreak: 0,
          };

          const winRate =
            pStats.gamesPlayed > 0
              ? Math.round((pStats.gamesWon / pStats.gamesPlayed) * 100)
              : 0;

          return (
            <div
              key={player.id}
              className="bg-white dark:bg-[#0c1c30] border border-slate-200 dark:border-[#1b3558] rounded-2xl p-4.5 hover:border-amber-400/50 dark:hover:border-amber-400/40 transition-all space-y-4 shadow-sm dark:shadow-none"
            >
              {/* Profile Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-13 h-13 rounded-2xl flex items-center justify-center text-2xl shrink-0 border shadow-md"
                    style={{
                      backgroundColor: `${player.color}20`,
                      borderColor: `${player.color}50`,
                    }}
                  >
                    {player.avatar}
                  </div>
                  <div>
                    <h3 className="font-display font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                      {player.name}
                      {pStats.currentStreak >= 2 && (
                        <span className="text-[10px] font-extrabold text-amber-600 dark:text-amber-400 flex items-center gap-0.5" title="Hot win streak">
                          <Flame className="w-3 h-3 fill-amber-500 text-amber-500" /> {pStats.currentStreak}W
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{player.nickname}</p>
                  </div>
                </div>

                {/* Edit & Delete Controls */}
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => openEditModal(player)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    title="Edit Profile"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(player.id, player.name)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                    title="Delete Profile"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Lifetime Stats Strip (Zero-Pill Typography) */}
              <div className="grid grid-cols-4 gap-2 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-center">
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight block">
                    Played
                  </span>
                  <span className="font-display text-sm font-bold text-slate-900 dark:text-white tabular-nums">
                    {pStats.gamesPlayed}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight block">
                    Victories
                  </span>
                  <span className="font-display text-sm font-bold text-amber-600 dark:text-amber-400 tabular-nums">
                    {pStats.gamesWon}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight block">
                    Win Rate
                  </span>
                  <span className="font-display text-sm font-bold text-blue-600 dark:text-amber-300 tabular-nums">
                    {winRate}%
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-tight block" title="0-Point Round Wins">
                    0-Pt Rounds
                  </span>
                  <span className="font-display text-sm font-bold text-sky-600 dark:text-sky-400 tabular-nums">
                    {pStats.zeroPointRoundsCount}
                  </span>
                </div>
              </div>

              {/* Badges / Accolades */}
              <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                <span>Streak: {pStats.bestStreak} Best</span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                <span>Total Pts: {pStats.totalPoints}</span>
                <span aria-hidden="true" className="text-slate-300 dark:text-slate-600">·</span>
                <span className="text-amber-600 dark:text-amber-400 font-semibold">
                  {pStats.zeroPointRoundsCount >= 8 ? '🃏 Joker Specialist' : winRate >= 50 && pStats.gamesPlayed >= 3 ? '👑 Master' : '🎲 Contender'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add / Edit Profile Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-[#091a2f] border border-slate-200 dark:border-[#1b3558] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden my-auto animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-[#1b3558] bg-slate-50 dark:bg-[#071322]">
              <h3 className="font-heraldic font-bold text-base text-slate-900 dark:text-white">
                {editingPlayer ? 'Edit Family Member' : 'New Family Member Profile'}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Player Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Grandma, Uncle Joe, Sophia"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#071322] border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Title or Nickname
                </label>
                <input
                  type="text"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  placeholder="e.g. Card Shark, Lucky Star, Bluff Master"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-[#071322] border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white text-sm focus:outline-none focus:border-amber-500 dark:focus:border-amber-400"
                />
              </div>

              {/* Avatar Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Select Avatar Icon
                </label>
                <div className="grid grid-cols-8 gap-2">
                  {AVATAR_OPTIONS.map((av) => (
                    <button
                      key={av}
                      type="button"
                      onClick={() => setAvatar(av)}
                      className={`w-10 h-10 rounded-xl text-lg flex items-center justify-center border transition-all ${
                        avatar === av
                          ? 'bg-amber-500/20 border-amber-500 dark:border-amber-400 scale-110 shadow-md'
                          : 'bg-slate-50 dark:bg-[#071322] border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-700'
                      }`}
                    >
                      {av}
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Theme Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 uppercase tracking-wider">
                  Player Color Theme
                </label>
                <div className="flex items-center gap-2.5">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-8 h-8 rounded-full border-2 transition-transform flex items-center justify-center ${
                        color === c ? 'scale-125 border-slate-900 dark:border-white shadow-lg' : 'border-transparent hover:scale-110'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-3.5 h-3.5 text-white drop-shadow stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-[#1b3558]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white text-xs font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="touch-btn min-h-[44px] px-5 py-2.5 bg-gradient-to-r from-blue-700 via-blue-600 to-blue-700 hover:from-blue-600 hover:to-blue-500 border border-blue-400/40 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-950/20 active:scale-98 transition-all"
                >
                  {editingPlayer ? 'Save Changes' : 'Create Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
