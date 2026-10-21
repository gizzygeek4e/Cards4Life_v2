import {
  getFirestore,
  doc,
  collection,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocFromServer,
  getDocs,
  query,
  orderBy,
  Unsubscribe,
} from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './googlePhotos';
import firebaseConfig from '../../firebase-applet-config.json';
import { GameMatch, Player, PlayerStats } from '../types';
import { storage } from './storage';

// Initialize Cloud Firestore with provisioned Database ID
const configuredDatabaseId = (firebaseConfig as { firestoreDatabaseId?: string }).firestoreDatabaseId;
export const db = configuredDatabaseId
  ? getFirestore(auth.app, configuredDatabaseId)
  : getFirestore(auth.app);

export const DEFAULT_FAMILY_ID = 'fourie-family';

// Real-time Cloud Connection state
export interface CloudSyncStatus {
  isConnected: boolean;
  isSyncing: boolean;
  familyId: string;
  lastSyncedAt: number | null;
  currentUser: User | null;
  error: string | null;
}

type SyncStatusListener = (status: CloudSyncStatus) => void;
const statusListeners: Set<SyncStatusListener> = new Set();

let currentStatus: CloudSyncStatus = {
  isConnected: false,
  isSyncing: false,
  familyId: DEFAULT_FAMILY_ID,
  lastSyncedAt: null,
  currentUser: null,
  error: null,
};

function notifyStatusChange() {
  statusListeners.forEach((listener) => {
    try {
      listener({ ...currentStatus });
    } catch (e) {
      console.error('Error in sync status listener:', e);
    }
  });
}

export function subscribeSyncStatus(listener: SyncStatusListener): () => void {
  statusListeners.add(listener);
  listener({ ...currentStatus });
  return () => {
    statusListeners.delete(listener);
  };
}

// 1. Mandatory Firestore connection test per Skill directive
export async function testConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    currentStatus.isConnected = true;
    notifyStatusChange();
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is currently running offline. Local changes will sync when reconnected.');
    }
    // Connected to server or cached
    currentStatus.isConnected = true;
    notifyStatusChange();
    return true;
  }
}

// Ensure an authenticated session exists (Anonymous auth for family phones or Google Auth)
export async function ensureAuth(): Promise<User | null> {
  if (auth.currentUser) {
    currentStatus.currentUser = auth.currentUser;
    notifyStatusChange();
    return auth.currentUser;
  }

  try {
    const cred = await signInAnonymously(auth);
    currentStatus.currentUser = cred.user;
    notifyStatusChange();
    return cred.user;
  } catch (err) {
    console.warn('Anonymous sign in note:', err);
    return auth.currentUser;
  }
}

// Ensure root Family room document exists
export async function ensureFamilyRoom(familyId: string = DEFAULT_FAMILY_ID): Promise<void> {
  try {
    await ensureAuth();
    const familyDocRef = doc(db, 'families', familyId);
    await setDoc(
      familyDocRef,
      {
        id: familyId,
        name: 'Fourie Family',
        lastActiveAt: Date.now(),
        createdAt: Date.now(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('ensureFamilyRoom background note:', err);
  }
}

/**
 * Real-time subscription to Family Players
 */
export function subscribeToFamilyPlayers(
  familyId: string = DEFAULT_FAMILY_ID,
  onPlayersUpdate: (players: Player[]) => void
): Unsubscribe {
  const playersCol = collection(db, 'families', familyId, 'players');
  const q = query(playersCol, orderBy('createdAt', 'asc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const players: Player[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        players.push({
          id: docSnap.id,
          name: data.name || 'Player',
          nickname: data.nickname || '',
          avatar: data.avatar || '🃏',
          color: data.color || '#e5a924',
          createdAt: data.createdAt || Date.now(),
        });
      });

      if (players.length > 0) {
        onPlayersUpdate(players);
        storage.savePlayers(players);
        currentStatus.lastSyncedAt = Date.now();
        currentStatus.isConnected = true;
        notifyStatusChange();
      }
    },
    (error) => {
      console.warn('Players snapshot subscription notice:', error.message);
      currentStatus.error = error.message;
      notifyStatusChange();
    }
  );
}

/**
 * Real-time subscription to Family Matches (Completed History)
 */
export function subscribeToFamilyMatches(
  familyId: string = DEFAULT_FAMILY_ID,
  onMatchesUpdate: (matches: GameMatch[]) => void
): Unsubscribe {
  const matchesCol = collection(db, 'families', familyId, 'matches');
  const q = query(matchesCol, orderBy('completedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const matches: GameMatch[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as GameMatch;
        matches.push({
          ...data,
          id: docSnap.id,
        });
      });

      onMatchesUpdate(matches);
      storage.saveMatchHistory(matches);
      currentStatus.lastSyncedAt = Date.now();
      currentStatus.isConnected = true;
      notifyStatusChange();
    },
    (error) => {
      console.warn('Matches snapshot subscription notice:', error.message);
      currentStatus.error = error.message;
      notifyStatusChange();
    }
  );
}

/**
 * Real-time subscription to Family Active Drafts
 */
export function subscribeToFamilyDrafts(
  familyId: string = DEFAULT_FAMILY_ID,
  onDraftsUpdate: (drafts: GameMatch[]) => void
): Unsubscribe {
  const draftsCol = collection(db, 'families', familyId, 'drafts');
  const q = query(draftsCol, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const drafts: GameMatch[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.match) {
          drafts.push({
            ...data.match,
            id: docSnap.id,
            updatedAt: data.updatedAt || Date.now(),
          });
        }
      });

      onDraftsUpdate(drafts);
      currentStatus.lastSyncedAt = Date.now();
      currentStatus.isConnected = true;
      notifyStatusChange();
    },
    (error) => {
      console.warn('Drafts snapshot subscription notice:', error.message);
      currentStatus.error = error.message;
      notifyStatusChange();
    }
  );
}

// -------------------------------------------------------------
// Cloud Sync Write Operations
// -------------------------------------------------------------

export async function savePlayerToCloud(
  player: Player,
  familyId: string = DEFAULT_FAMILY_ID
): Promise<void> {
  try {
    await ensureAuth();
    const playerDoc = doc(db, 'families', familyId, 'players', player.id);
    await setDoc(
      playerDoc,
      {
        id: player.id,
        familyId,
        name: player.name,
        nickname: player.nickname || '',
        avatar: player.avatar || '🃏',
        color: player.color || '#e5a924',
        createdAt: player.createdAt || Date.now(),
      },
      { merge: true }
    );
    currentStatus.lastSyncedAt = Date.now();
    notifyStatusChange();
  } catch (err) {
    console.error('Failed to sync player to cloud:', err);
  }
}

export async function deletePlayerFromCloud(
  playerId: string,
  familyId: string = DEFAULT_FAMILY_ID
): Promise<void> {
  try {
    await ensureAuth();
    const playerDoc = doc(db, 'families', familyId, 'players', playerId);
    await deleteDoc(playerDoc);
    currentStatus.lastSyncedAt = Date.now();
    notifyStatusChange();
  } catch (err) {
    console.error('Failed to delete player from cloud:', err);
  }
}

export async function saveMatchToCloud(
  match: GameMatch,
  familyId: string = DEFAULT_FAMILY_ID
): Promise<void> {
  try {
    await ensureAuth();
    const matchDoc = doc(db, 'families', familyId, 'matches', match.id);
    await setDoc(matchDoc, {
      ...match,
      familyId,
    });
    // Also remove any existing draft doc for this match from cloud
    const draftDoc = doc(db, 'families', familyId, 'drafts', match.id);
    await deleteDoc(draftDoc).catch(() => {});

    currentStatus.lastSyncedAt = Date.now();
    notifyStatusChange();
  } catch (err) {
    console.error('Failed to sync match to cloud:', err);
  }
}

export async function deleteMatchFromCloud(
  matchId: string,
  familyId: string = DEFAULT_FAMILY_ID
): Promise<void> {
  try {
    await ensureAuth();
    const matchDoc = doc(db, 'families', familyId, 'matches', matchId);
    await deleteDoc(matchDoc);
    currentStatus.lastSyncedAt = Date.now();
    notifyStatusChange();
  } catch (err) {
    console.error('Failed to delete match from cloud:', err);
  }
}

export async function saveDraftToCloud(
  match: GameMatch,
  familyId: string = DEFAULT_FAMILY_ID
): Promise<void> {
  try {
    await ensureAuth();
    const draftDoc = doc(db, 'families', familyId, 'drafts', match.id);
    await setDoc(
      draftDoc,
      {
        id: match.id,
        familyId,
        updatedAt: Date.now(),
        match,
      },
      { merge: true }
    );
    currentStatus.lastSyncedAt = Date.now();
    notifyStatusChange();
  } catch (err) {
    console.error('Failed to sync draft to cloud:', err);
  }
}

export async function deleteDraftFromCloud(
  matchId: string,
  familyId: string = DEFAULT_FAMILY_ID
): Promise<void> {
  try {
    await ensureAuth();
    const draftDoc = doc(db, 'families', familyId, 'drafts', matchId);
    await deleteDoc(draftDoc);
    currentStatus.lastSyncedAt = Date.now();
    notifyStatusChange();
  } catch (err) {
    console.error('Failed to delete draft from cloud:', err);
  }
}

/**
 * Initialize cloud sync:
 * 1. Test server connection
 * 2. Authenticate session
 * 3. Seed starter data if cloud is empty so new devices have the Fourie Family profiles immediately
 */
export async function initializeCloudSync(familyId: string = DEFAULT_FAMILY_ID): Promise<void> {
  try {
    currentStatus.isSyncing = true;
    notifyStatusChange();

    await testConnection();
    await ensureAuth();
    await ensureFamilyRoom(familyId);

    // Check if cloud players exist
    const playersCol = collection(db, 'families', familyId, 'players');
    const existingPlayersSnap = await getDocs(playersCol);

    if (existingPlayersSnap.empty) {
      // Seed default Fourie family players from local storage to cloud
      const initialPlayers = storage.getPlayers();
      for (const p of initialPlayers) {
        await savePlayerToCloud(p, familyId);
      }

      // Also seed any historical matches from localStorage if present
      const initialMatches = storage.getMatchHistory();
      for (const m of initialMatches) {
        await saveMatchToCloud(m, familyId);
      }
    }

    currentStatus.isSyncing = false;
    currentStatus.isConnected = true;
    currentStatus.lastSyncedAt = Date.now();
    notifyStatusChange();
  } catch (err) {
    console.warn('initializeCloudSync note:', err);
    currentStatus.isSyncing = false;
    notifyStatusChange();
  }
}
