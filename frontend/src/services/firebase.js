/**
 * DermaScreen — Firebase Client SDK Configuration
 * Initialize Firebase Auth for the frontend.
 */

import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";

// ============================================================
// PUT YOUR FIREBASE WEB APP CONFIG HERE
// Get it from: Firebase Console → Project Settings → General → Your Apps → Web App
// ============================================================
const firebaseConfig = {
  apiKey: "AIzaSyC9y4JwdOqwJcrixp8rruvoQaJ0Lqw_Zqk",
  authDomain: "dermascreen-242c0.firebaseapp.com",
  projectId: "dermascreen-242c0",
  storageBucket: "dermascreen-242c0.firebasestorage.app",
  messagingSenderId: "54264370367",
  appId: "1:54264370367:web:346e586bb139595657a20a",
  measurementId: "G-Y0H9H1LSX9"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// ─────────────────── Auth Functions ───────────────────

/**
 * Sign in with email and password.
 */
export async function loginWithEmail(email, password) {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Create a new account with email and password.
 */
export async function signupWithEmail(email, password, displayName = "") {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  if (displayName) {
    await updateProfile(userCredential.user, { displayName });
  }
  return userCredential.user;
}

/**
 * Sign in with Google popup.
 */
export async function loginWithGoogle() {
  const userCredential = await signInWithPopup(auth, googleProvider);
  return userCredential.user;
}

/**
 * Sign out the current user.
 */
export async function logoutUser() {
  await signOut(auth);
}

/**
 * Get the current user's ID token for API authentication.
 */
export async function getIdToken() {
  const user = auth.currentUser;
  if (!user) return null;
  return await user.getIdToken();
}

/**
 * Subscribe to auth state changes.
 */
export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

/**
 * Send password reset email.
 */
export async function sendResetPasswordEmail(email) {
  await sendPasswordResetEmail(auth, email);
}

export { auth };
