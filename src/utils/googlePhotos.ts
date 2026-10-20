import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

export const PHOTOS_SCOPES = [
  'https://www.googleapis.com/auth/photoslibrary.appendonly',
  'https://www.googleapis.com/auth/photoslibrary.sharing',
];

const provider = new GoogleAuthProvider();
PHOTOS_SCOPES.forEach((scope) => provider.addScope(scope));

// In-memory access token caching (do not store tokens in localStorage)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Initialize auth state listener
export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!isSigningIn) {
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const getCachedAccessToken = (): string | null => {
  return cachedAccessToken;
};

// Sign in with Google using popup
export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error('Failed to retrieve access token from Google sign-in.');
    }

    cachedAccessToken = credential.accessToken;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error) {
    console.error('Google Sign-in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const googleSignOut = async (): Promise<void> => {
  await signOut(auth);
  cachedAccessToken = null;
};

// Cached album ID in localStorage so we don't duplicate albums across games
const ALBUM_CACHE_KEY = 'cards4life_google_photos_album_id';

/**
 * Get or create "Cards 4 Life - Family Matches" album in user's Google Photos
 */
export const getOrCreateCardsAlbum = async (accessToken: string): Promise<string> => {
  const cachedId = localStorage.getItem(ALBUM_CACHE_KEY);
  if (cachedId) {
    return cachedId;
  }

  const ALBUM_TITLE = 'Cards 4 Life - Family Matches';

  try {
    // 1. Try to search user's albums first
    const listRes = await fetch('https://photoslibrary.googleapis.com/v1/albums?pageSize=50', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (listRes.ok) {
      const data = await listRes.json();
      const existing = (data.albums || []).find((a: { title: string }) => a.title === ALBUM_TITLE);
      if (existing?.id) {
        localStorage.setItem(ALBUM_CACHE_KEY, existing.id);
        return existing.id;
      }
    }

    // 2. Create new album
    const createRes = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        album: {
          title: ALBUM_TITLE,
        },
      }),
    });

    if (!createRes.ok) {
      const err = await createRes.text();
      throw new Error(`Failed to create Google Photos album: ${err}`);
    }

    const created = await createRes.json();
    if (created?.id) {
      localStorage.setItem(ALBUM_CACHE_KEY, created.id);
      return created.id;
    }
    throw new Error('No album ID returned from Google Photos');
  } catch (err) {
    console.error('Error getting/creating album:', err);
    throw err;
  }
};

/**
 * Upload a match photo (Base64 data URL) into Google Photos and add to the Cards 4 Life album
 */
export const uploadMatchPhotoToGooglePhotos = async (
  accessToken: string,
  photoDataUrl: string,
  matchTitle: string,
  winnerName?: string
): Promise<{ productUrl?: string; mediaItemId?: string; albumId: string }> => {
  // 1. Ensure album exists
  const albumId = await getOrCreateCardsAlbum(accessToken);

  // 2. Convert Data URL to binary ArrayBuffer
  const commaIdx = photoDataUrl.indexOf(',');
  const mimeMatch = photoDataUrl.match(/data:([^;]+);/);
  const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
  const base64Data = commaIdx > -1 ? photoDataUrl.substring(commaIdx + 1) : photoDataUrl;

  const binaryString = atob(base64Data);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }

  // 3. Upload raw byte stream to Google Photos upload endpoint
  const uploadRes = await fetch('https://photoslibrary.googleapis.com/v1/uploads', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-type': 'application/octet-stream',
      'X-Goog-Upload-Content-Type': mimeType,
      'X-Goog-Upload-Protocol': 'raw',
    },
    body: bytes,
  });

  if (!uploadRes.ok) {
    const errorText = await uploadRes.text();
    throw new Error(`Failed to upload photo bytes to Google Photos: ${errorText}`);
  }

  const uploadToken = await uploadRes.text();

  // 4. Create Media Item inside the Album
  const description = winnerName
    ? `Cards 4 Life · ${matchTitle} · Champion: ${winnerName}`
    : `Cards 4 Life · ${matchTitle}`;

  const fileName = `Cards4Life_${Date.now()}.jpg`;

  const batchCreateRes = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      albumId,
      newMediaItems: [
        {
          description,
          simpleMediaItem: {
            fileName,
            uploadToken,
          },
        },
      ],
    }),
  });

  if (!batchCreateRes.ok) {
    const batchErr = await batchCreateRes.text();
    throw new Error(`Failed to add photo to Google Photos album: ${batchErr}`);
  }

  const batchResult = await batchCreateRes.json();
  const creationResult = batchResult?.newMediaItemResults?.[0];

  if (creationResult?.status?.message && creationResult.status.code !== 0 && creationResult.status.message !== 'Success') {
    throw new Error(`Google Photos creation error: ${creationResult.status.message}`);
  }

  const mediaItem = creationResult?.mediaItem;
  return {
    productUrl: mediaItem?.productUrl,
    mediaItemId: mediaItem?.id,
    albumId,
  };
};
