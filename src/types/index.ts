export type GameMode = 'AMERICAN_JOKER' | 'STANDARD_POINTS';

export type WinningCondition = 'LOWEST_SCORE' | 'HIGHEST_SCORE';

export interface Player {
  id: string;
  name: string;
  nickname: string;
  avatar: string; // emoji or avatar key
  color: string; // tailwind color or hex
  createdAt: number;
}

export interface PlayerStats {
  playerId: string;
  gamesPlayed: number;
  gamesWon: number;
  totalPoints: number;
  bestRoundScore: number;
  zeroPointRoundsCount: number; // rounds won with 0 score
  currentStreak: number;
  bestStreak: number;
  lastPlayedAt?: number;
}

export interface RoundScore {
  playerId: string;
  score: number;
  isRoundWinner: boolean; // 0-score preservation flag
  notes?: string;
}

export interface GameRound {
  roundNumber: number;
  name: string; // e.g. "Round 1: 3 Cards" or "Round 1"
  description?: string;
  scores: Record<string, RoundScore>; // playerId -> RoundScore
  dealerPlayerId: string;
  finalizedAt?: number;
}

export interface GameMatch {
  id: string;
  title: string;
  mode: GameMode;
  winningCondition: WinningCondition;
  maxRounds: number; // 5 for American Joker, or custom
  targetScore?: number; // optional target score for standard points mode
  playerIds: string[]; // active players in order of seating
  currentRoundIndex: number; // 0-indexed
  rounds: GameRound[];
  startedAt: number;
  completedAt?: number;
  winnerPlayerId?: string;
  finalRankings?: { playerId: string; totalScore: number; rank: number }[];
  status: 'IN_PROGRESS' | 'COMPLETED';
  updatedAt?: number;
  photoUrl?: string;
  googlePhotosAlbumId?: string;
  googlePhotosMediaItemId?: string;
  googlePhotosUrl?: string;
  googlePhotosUploaded?: boolean;
}

export interface AmericanJokerRoundConfig {
  roundNumber: number;
  name: string;
  cardsDealt: number;
  contract: string;
  tip: string;
}

export const AMERICAN_JOKER_ROUNDS: AmericanJokerRoundConfig[] = [
  {
    roundNumber: 1,
    name: 'Round 1 (3 Cards)',
    cardsDealt: 3,
    contract: '1 Set of 3',
    tip: 'Lowest penalty wins! First player to lay down scores 0.'
  },
  {
    roundNumber: 2,
    name: 'Round 2 (4 Cards)',
    cardsDealt: 4,
    contract: '1 Set & 1 Pair (or 4 of a Kind)',
    tip: 'Save wild Jokers for high penalty protection.'
  },
  {
    roundNumber: 3,
    name: 'Round 3 (5 Cards)',
    cardsDealt: 5,
    contract: '1 Run of 4 or 5',
    tip: 'Going out preserves your round score at pristine 0.'
  },
  {
    roundNumber: 4,
    name: 'Round 4 (6 Cards)',
    cardsDealt: 6,
    contract: '2 Sets of 3',
    tip: 'Unmelded Jokers are 50 pts penalty in hand!'
  },
  {
    roundNumber: 5,
    name: 'Round 5 (7 Cards - Finale)',
    cardsDealt: 7,
    contract: '2 Sets & 1 Run (Final Showdown)',
    tip: 'Final round! Total lowest cumulative score takes the championship.'
  }
];

export const CARD_POINT_VALUES = [
  { label: 'Joker', points: 50, color: 'text-amber-400', desc: '50 pts penalty' },
  { label: 'Ace', points: 20, color: 'text-rose-400', desc: '20 pts (or 1 pt if low)' },
  { label: 'Face (K, Q, J)', points: 10, color: 'text-blue-400', desc: '10 pts each' },
  { label: 'Number (2-10)', points: 5, color: 'text-blue-300', desc: 'Face value (or 5 pts)' }
];
