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

// Initialize Firebase App safely
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Scopes required for Google Docs, Google Sheets & Google Drive file creation
export const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/documents',
];

const provider = new GoogleAuthProvider();
SCOPES.forEach(scope => provider.addScope(scope));
provider.setCustomParameters({ prompt: 'select_account' });

// In-memory token caching (Do NOT store in localStorage per security guidelines)
let cachedAccessToken: string | null = null;
let cachedUser: User | null = null;
let activeSignInPromise: Promise<{ user: User; accessToken: string }> | null = null;

export const hasCachedToken = (): boolean => {
  return Boolean(cachedAccessToken);
};

/**
 * Initialize auth listener for Google Workspace
 */
export const initWorkspaceAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    cachedUser = user;
    if (user) {
      if (cachedAccessToken) {
        if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
      } else if (!activeSignInPromise) {
        cachedAccessToken = null;
        if (onAuthFailure) onAuthFailure();
      }
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

/**
 * Sign in with Google to get access token for Google Docs & Sheets API
 */
export const googleSignIn = async (): Promise<{ user: User; accessToken: string }> => {
  // If already authenticated and token cached, return cached credentials
  if (cachedAccessToken && cachedUser) {
    return { user: cachedUser, accessToken: cachedAccessToken };
  }

  // If another sign-in popup is already open, await the existing request to prevent auth/cancelled-popup-request
  if (activeSignInPromise) {
    return activeSignInPromise;
  }

  activeSignInPromise = (async () => {
    try {
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (!credential?.accessToken) {
        throw new Error('Failed to retrieve access token from Google authentication.');
      }

      cachedAccessToken = credential.accessToken;
      cachedUser = result.user;
      return { user: result.user, accessToken: cachedAccessToken };
    } catch (error: any) {
      const errCode = error?.code || '';
      if (
        errCode === 'auth/popup-closed-by-user' ||
        errCode === 'auth/cancelled-popup-request' ||
        errCode === 'auth/popup-blocked'
      ) {
        console.warn('Google Sign-In popup was closed or cancelled by user.');
        throw new Error('Google Sign-In popup was closed or cancelled.');
      }
      console.error('Google Sign-In Error:', error);
      throw error;
    } finally {
      activeSignInPromise = null;
    }
  })();

  return activeSignInPromise;
};

/**
 * Get current cached access token
 */
export const getAccessToken = async (): Promise<string | null> => {
  return cachedAccessToken;
};

/**
 * Sign out of Google session
 */
export const googleSignOut = async () => {
  await signOut(auth);
  cachedAccessToken = null;
  cachedUser = null;
};

export interface GoogleDocCreationResult {
  documentId: string;
  title: string;
  docUrl: string;
}

/**
 * Create a new Google Document with the full BEMS narrative and insert the content
 */
export const createBEMSGoogleDocument = async (
  docTitle: string,
  content: string,
  onProgress?: (status: string) => void
): Promise<GoogleDocCreationResult> => {
  let token = cachedAccessToken;
  if (!token) {
    onProgress?.('Authenticating with Google Account...');
    const authResult = await googleSignIn();
    token = authResult.accessToken;
  }

  onProgress?.('Creating new Google Document in your Google Drive...');
  // 1. Create the blank document with the title
  const createRes = await fetch('https://docs.googleapis.com/v1/documents', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: docTitle,
    }),
  });

  if (!createRes.ok) {
    const errText = await createRes.text();
    throw new Error(`Failed to create Google Document: ${createRes.status} ${errText}`);
  }

  const createdDoc = await createRes.json();
  const documentId = createdDoc.documentId;
  const docUrl = `https://docs.google.com/document/d/${documentId}/edit`;

  onProgress?.('Formatting and populating complete BEMS documentation...');

  // 2. Insert text content into the document
  // Google Docs API accepts batchUpdate with insertText at index 1
  // To avoid hitting API payload limits, we insert in batches if content is very large
  const MAX_CHUNK_SIZE = 40000;
  if (content.length <= MAX_CHUNK_SIZE) {
    const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        requests: [
          {
            insertText: {
              location: { index: 1 },
              text: content,
            },
          },
        ],
      }),
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      console.warn('Batch update issue:', errText);
    }
  } else {
    // Insert text in chunks from end to start to maintain index ordering
    const chunks: string[] = [];
    for (let i = 0; i < content.length; i += MAX_CHUNK_SIZE) {
      chunks.push(content.slice(i, i + MAX_CHUNK_SIZE));
    }

    // Insert first chunk at index 1
    let currentIndex = 1;
    for (let i = 0; i < chunks.length; i++) {
      onProgress?.(`Writing section ${i + 1} of ${chunks.length}...`);
      const updateRes = await fetch(`https://docs.googleapis.com/v1/documents/${documentId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              insertText: {
                location: { index: currentIndex },
                text: chunks[i],
              },
            },
          ],
        }),
      });

      if (!updateRes.ok) {
        const errText = await updateRes.text();
        console.warn(`Chunk ${i} write error:`, errText);
      }
      currentIndex += chunks[i].length;
    }
  }

  onProgress?.('Document generation complete!');
  return {
    documentId,
    title: docTitle,
    docUrl,
  };
};
