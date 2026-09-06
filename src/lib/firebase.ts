import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from "firebase/auth";
import {
  getFirestore,
  Firestore
} from "firebase/firestore";
import firebaseConfig from "../../firebase-applet-config.json";

// Initialize Firebase App singleton
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Authentication Instance
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});

// Check if redirected from sign in
getRedirectResult(auth).catch((err) => {
  if (err?.code !== 'auth/null-user') {
    console.warn("Redirect auth check notice:", err);
  }
});

// Firestore Instance (bound to specified database ID)
let firestoreDb: Firestore;
try {
  if (firebaseConfig.firestoreDatabaseId && firebaseConfig.firestoreDatabaseId !== "(default)") {
    firestoreDb = getFirestore(app, firebaseConfig.firestoreDatabaseId);
  } else {
    firestoreDb = getFirestore(app);
  }
} catch (err) {
  console.warn("Initializing default Firestore instance:", err);
  firestoreDb = getFirestore(app);
}

export const db = firestoreDb;

// Defensive Undefined-Stripping Utility to guarantee zero-crash payload hygiene
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  return JSON.parse(JSON.stringify(data, (_key, value) => {
    return value === undefined ? null : value;
  }));
}

// Google Sign-In Helper
export async function loginWithGoogle(loginHint?: string): Promise<FirebaseUser> {
  const provider = new GoogleAuthProvider();
  const customParams: Record<string, string> = {
    prompt: "select_account"
  };
  if (loginHint) {
    customParams.login_hint = loginHint;
  }
  provider.setCustomParameters(customParams);

  try {
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' || 
      error?.code === 'auth/cancelled-popup-request' ||
      (typeof error?.message === 'string' && (
        error.message.includes('popup-closed-by-user') ||
        error.message.includes('cancelled-popup-request')
      ))
    ) {
      console.info("Google sign-in popup was closed by the user.");
      throw error;
    }
    console.warn("Popup sign-in encountered an issue:", error);
    if (error?.code === 'auth/popup-blocked') {
      try {
        await signInWithRedirect(auth, provider);
      } catch (redirectErr) {
        console.error("Redirect sign-in failed:", redirectErr);
      }
    }
    throw error;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export { onAuthStateChanged };
export type { FirebaseUser };
