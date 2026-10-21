import { GameMatch, Player, PlayerStats } from '../types';

const STORAGE_KEYS = {
  PLAYERS: 'cards4life_players',
  STATS: 'cards4life_stats',
  ACTIVE_MATCH: 'cards4life_active_match',
  DRAFTS: 'cards4life_match_drafts',
  MATCH_HISTORY: 'cards4life_match_history',
};

// Initial default family profiles if fresh app
const DEFAULT_PLAYERS: Player[] = [
  {
    id: 'p1_dad',
    name: 'Dad',
    nickname: 'The Card Shark',
    avatar: '🦁',
    color: '#e5a924', // Crest Gold
    createdAt: Date.now() - 1000000,
  },
  {
    id: 'p2_mom',
    name: 'Mom',
    nickname: 'The Grandmaster',
    avatar: '👑',
    color: '#1d5b96', // Royal Blue
    createdAt: Date.now() - 900000,
  },
  {
    id: 'p3_lucas',
    name: 'Lucas',
    nickname: 'Joker Hunter',
    avatar: '⚡',
    color: '#3b82c4', // Cerulean Sky Blue
    createdAt: Date.now() - 800000,
  },
  {
    id: 'p4_maya',
    name: 'Maya',
    nickname: 'Lucky Charm',
    avatar: '🕊️',
    color: '#dc2626', // Ace of Hearts Ruby Red
    createdAt: Date.now() - 700000,
  },
];

// Initial starter stats
const DEFAULT_STATS: Record<string, PlayerStats> = {
  p1_dad: {
    playerId: 'p1_dad',
    gamesPlayed: 6,
    gamesWon: 3,
    totalPoints: 245,
    bestRoundScore: 0,
    zeroPointRoundsCount: 8,
    currentStreak: 1,
    bestStreak: 2,
    lastPlayedAt: Date.now() - 86400000,
  },
  p2_mom: {
    playerId: 'p2_mom',
    gamesPlayed: 6,
    gamesWon: 2,
    totalPoints: 210,
    bestRoundScore: 0,
    zeroPointRoundsCount: 11,
    currentStreak: 0,
    bestStreak: 2,
    lastPlayedAt: Date.now() - 86400000,
  },
  p3_lucas: {
    playerId: 'p3_lucas',
    gamesPlayed: 5,
    gamesWon: 1,
    totalPoints: 290,
    bestRoundScore: 0,
    zeroPointRoundsCount: 5,
    currentStreak: 0,
    bestStreak: 1,
    lastPlayedAt: Date.now() - 86400000,
  },
  p4_maya: {
    playerId: 'p4_maya',
    gamesPlayed: 5,
    gamesWon: 0,
    totalPoints: 315,
    bestRoundScore: 0,
    zeroPointRoundsCount: 4,
    currentStreak: 0,
    bestStreak: 0,
    lastPlayedAt: Date.now() - 86400000,
  },
};

export const storage = {
  // Players
  getPlayers(): Player[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PLAYERS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(DEFAULT_PLAYERS));
        return DEFAULT_PLAYERS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_PLAYERS;
    }
  },

  savePlayers(players: Player[]): void {
    localStorage.setItem(STORAGE_KEYS.PLAYERS, JSON.stringify(players));
  },

  addPlayer(name: string, nickname: string, avatar: string, color: string): Player {
    const players = this.getPlayers();
    const newPlayer: Player = {
      id: `player_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: name.trim() || 'Player',
      nickname: nickname.trim() || 'Rookie',
      avatar: avatar || '🃏',
      color: color || '#3b82f6',
      createdAt: Date.now(),
    };
    players.push(newPlayer);
    this.savePlayers(players);

    // Initialize stats
    const stats = this.getStats();
    stats[newPlayer.id] = {
      playerId: newPlayer.id,
      gamesPlayed: 0,
      gamesWon: 0,
      totalPoints: 0,
      bestRoundScore: 0,
      zeroPointRoundsCount: 0,
      currentStreak: 0,
      bestStreak: 0,
      lastPlayedAt: Date.now(),
    };
    this.saveStats(stats);

    return newPlayer;
  },

  updatePlayer(updated: Player): void {
    const players = this.getPlayers().map((p) => (p.id === updated.id ? updated : p));
    this.savePlayers(players);
  },

  deletePlayer(playerId: string): void {
    const players = this.getPlayers().filter((p) => p.id !== playerId);
    this.savePlayers(players);

    // Also remove from stats
    const stats = this.getStats();
    delete stats[playerId];
    this.saveStats(stats);
  },

  // Stats
  getStats(): Record<string, PlayerStats> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.STATS);
      if (!data) {
        localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(DEFAULT_STATS));
        return DEFAULT_STATS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_STATS;
    }
  },

  saveStats(stats: Record<string, PlayerStats>): void {
    localStorage.setItem(STORAGE_KEYS.STATS, JSON.stringify(stats));
  },

  // Active match
  getActiveMatch(): GameMatch | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.ACTIVE_MATCH);
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  },

  saveActiveMatch(match: GameMatch | null): void {
    if (match === null) {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_MATCH);
    } else {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_MATCH, JSON.stringify(match));
    }
  },

  // Match drafts
  getDrafts(): GameMatch[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.DRAFTS);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveDraft(match: GameMatch, setAsActive: boolean = true): void {
    const drafts = this.getDrafts();
    const updatedMatch: GameMatch = {
      ...match,
      updatedAt: Date.now(),
      status: 'IN_PROGRESS',
    };
    const existingIndex = drafts.findIndex((d) => d.id === match.id);
    if (existingIndex > -1) {
      drafts[existingIndex] = updatedMatch;
    } else {
      drafts.unshift(updatedMatch);
    }
    localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
    if (setAsActive) {
      this.saveActiveMatch(updatedMatch);
    }
  },

  pauseAndSaveDraft(match: GameMatch): void {
    this.saveDraft(match, false);
    this.saveActiveMatch(null);
  },

  deleteDraft(matchId: string): void {
    const drafts = this.getDrafts().filter((d) => d.id !== matchId);
    localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(drafts));
    const active = this.getActiveMatch();
    if (active?.id === matchId) {
      this.saveActiveMatch(null);
    }
  },

  abandonActiveMatch(matchId?: string): void {
    const targetId = matchId || this.getActiveMatch()?.id;
    if (targetId) {
      this.deleteDraft(targetId);
    }
    this.saveActiveMatch(null);
  },

  // Match history
  getMatchHistory(): GameMatch[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.MATCH_HISTORY);
      if (!data) return [];
      return JSON.parse(data);
    } catch {
      return [];
    }
  },

  saveMatchHistory(matches: GameMatch[]): void {
    localStorage.setItem(STORAGE_KEYS.MATCH_HISTORY, JSON.stringify(matches));
  },

  updateMatch(updatedMatch: GameMatch): void {
    const history = this.getMatchHistory().map((m) =>
      m.id === updatedMatch.id ? updatedMatch : m
    );
    this.saveMatchHistory(history);
  },

  // Finalize completed match: save to history, update player stats
  completeMatch(match: GameMatch): void {
    // 1. Remove from drafts
    this.deleteDraft(match.id);

    // 2. Add to history
    const history = this.getMatchHistory();
    history.unshift(match);
    this.saveMatchHistory(history);

    // 2. Clear active match
    this.saveActiveMatch(null);

    // 3. Update lifetime stats
    const stats = this.getStats();
    const winnerId = match.winnerPlayerId;

    match.playerIds.forEach((pid) => {
      const current = stats[pid] || {
        playerId: pid,
        gamesPlayed: 0,
        gamesWon: 0,
        totalPoints: 0,
        bestRoundScore: 9999,
        zeroPointRoundsCount: 0,
        currentStreak: 0,
        bestStreak: 0,
        lastPlayedAt: Date.now(),
      };

      const isWinner = winnerId === pid;
      const newPlayed = current.gamesPlayed + 1;
      const newWon = current.gamesWon + (isWinner ? 1 : 0);
      const newStreak = isWinner ? current.currentStreak + 1 : 0;
      const bestStreak = Math.max(current.bestStreak, newStreak);

      // Sum points scored in this match and count 0-score rounds
      let matchPoints = 0;
      let zeroRounds = 0;
      let minRoundScore = 9999;

      match.rounds.forEach((r) => {
        const sc = r.scores[pid];
        if (sc !== undefined) {
          matchPoints += sc.score;
          if (sc.score === 0 || sc.isRoundWinner) {
            zeroRounds += 1;
          }
          if (sc.score < minRoundScore) {
            minRoundScore = sc.score;
          }
        }
      });

      stats[pid] = {
        playerId: pid,
        gamesPlayed: newPlayed,
        gamesWon: newWon,
        totalPoints: current.totalPoints + matchPoints,
        bestRoundScore: Math.min(current.bestRoundScore ?? 9999, minRoundScore),
        zeroPointRoundsCount: current.zeroPointRoundsCount + zeroRounds,
        currentStreak: newStreak,
        bestStreak,
        lastPlayedAt: match.completedAt || Date.now(),
      };
    });

    this.saveStats(stats);
  },

  recomputeStatsFromMatches(matches: GameMatch[], players: Player[]): Record<string, PlayerStats> {
    const stats: Record<string, PlayerStats> = {};
    players.forEach((p) => {
      const defaultP = DEFAULT_STATS[p.id];
      stats[p.id] = {
        playerId: p.id,
        gamesPlayed: defaultP ? defaultP.gamesPlayed : 0,
        gamesWon: defaultP ? defaultP.gamesWon : 0,
        totalPoints: defaultP ? defaultP.totalPoints : 0,
        bestRoundScore: defaultP ? defaultP.bestRoundScore : 9999,
        zeroPointRoundsCount: defaultP ? defaultP.zeroPointRoundsCount : 0,
        currentStreak: defaultP ? defaultP.currentStreak : 0,
        bestStreak: defaultP ? defaultP.bestStreak : 0,
        lastPlayedAt: defaultP ? defaultP.lastPlayedAt : p.createdAt,
      };
    });

    const sorted = [...matches].sort((a, b) => (a.completedAt || 0) - (b.completedAt || 0));
    sorted.forEach((match) => {
      const winnerId = match.winnerPlayerId;
      match.playerIds.forEach((pid) => {
        if (!stats[pid]) {
          stats[pid] = {
            playerId: pid,
            gamesPlayed: 0,
            gamesWon: 0,
            totalPoints: 0,
            bestRoundScore: 9999,
            zeroPointRoundsCount: 0,
            currentStreak: 0,
            bestStreak: 0,
            lastPlayedAt: match.completedAt || Date.now(),
          };
        }
        const current = stats[pid];
        const isWinner = winnerId === pid;
        current.gamesPlayed += 1;
        if (isWinner) {
          current.gamesWon += 1;
          current.currentStreak += 1;
          current.bestStreak = Math.max(current.bestStreak, current.currentStreak);
        } else {
          current.currentStreak = 0;
        }

        let matchPoints = 0;
        let zeroRounds = 0;
        let minRoundScore = 9999;
        match.rounds.forEach((r) => {
          const sc = r.scores[pid];
          if (sc !== undefined) {
            matchPoints += sc.score;
            if (sc.score === 0 || sc.isRoundWinner) {
              zeroRounds += 1;
            }
            if (sc.score < minRoundScore) {
              minRoundScore = sc.score;
            }
          }
        });
        current.totalPoints += matchPoints;
        current.bestRoundScore = Math.min(current.bestRoundScore ?? 9999, minRoundScore);
        current.zeroPointRoundsCount += zeroRounds;
        current.lastPlayedAt = match.completedAt || Date.now();
      });
    });

    this.saveStats(stats);
    return stats;
  },

  // Export / Import
  exportData(): string {
    const data = {
      players: this.getPlayers(),
      stats: this.getStats(),
      matchHistory: this.getMatchHistory(),
      drafts: this.getDrafts(),
      activeMatch: this.getActiveMatch(),
      exportedAt: new Date().toISOString(),
      version: 2,
    };
    return JSON.stringify(data, null, 2);
  },

  importData(jsonString: string): boolean {
    try {
      const parsed = JSON.parse(jsonString);
      if (parsed && Array.isArray(parsed.players)) {
        this.savePlayers(parsed.players);
        if (parsed.stats) this.saveStats(parsed.stats);
        if (Array.isArray(parsed.matchHistory)) this.saveMatchHistory(parsed.matchHistory);
        if (Array.isArray(parsed.drafts)) {
          localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(parsed.drafts));
        }
        if (parsed.activeMatch) {
          this.saveActiveMatch(parsed.activeMatch);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  },

  resetAll(): void {
    localStorage.removeItem(STORAGE_KEYS.PLAYERS);
    localStorage.removeItem(STORAGE_KEYS.STATS);
    localStorage.removeItem(STORAGE_KEYS.ACTIVE_MATCH);
    localStorage.removeItem(STORAGE_KEYS.DRAFTS);
    localStorage.removeItem(STORAGE_KEYS.MATCH_HISTORY);
  },
};
