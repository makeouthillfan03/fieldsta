import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions, httpsCallable } from "firebase/functions";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Persistent local cache (IndexedDB) so a technician who loses signal
// mid-job can still see previously loaded jobs/customers, and any writes
// they make queue up and sync once they're back online. Multi-tab manager
// keeps things consistent if the app is open in more than one tab.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

export const storage = getStorage(app);
export const functions = getFunctions(app);

// Calls the createCheckoutSession Cloud Function, which creates a real
// Stripe Checkout Session server-side (the Stripe secret key never touches
// the client) and returns a hosted payment link for the job's balance.
// Throws if Cloud Functions haven't been deployed yet, or Stripe secrets
// haven't been configured — see README.md "Stripe payments".
export function requestJobPaymentLink(jobId) {
  const call = httpsCallable(functions, "createCheckoutSession");
  return call({ jobId });
}

// Starts subscription checkout for the caller's company (owner/admin only)
// — base plan covers the owner + 1 teammate, plus a per-seat add-on for
// every additional teammate, computed server-side. Returns a hosted
// checkout URL to redirect to. See README.md "Subscription billing".
export function requestSubscriptionCheckout() {
  const call = httpsCallable(functions, "createSubscriptionCheckout");
  return call({});
}

// Sends a technician's freeform note to the parseQuickNote Cloud Function,
// which returns structured suggestions (never writes anything itself) —
// the caller decides what to actually apply. See README.md "AI Quick Note".
export function parseQuickNote(text, jobId) {
  const call = httpsCallable(functions, "parseQuickNote");
  return call({ text, jobId });
}

// Powers the standalone Assistant page: sends a freeform request plus a
// lightweight index of the company's customers/jobs so the AI can propose
// actions referencing real records. Returns proposed actions only — it
// never writes to Firestore itself.
export function runAssistant(message, customers, jobs) {
  const call = httpsCallable(functions, "runAssistant");
  return call({ message, customers, jobs });
}

const googleProvider = new GoogleAuthProvider();

// Try a popup first — it's the more reliable flow when it isn't blocked,
// since it doesn't depend on third-party storage access surviving a full
// page navigation away and back (redirect-based sign-in silently fails to
// complete on Safari/browsers with strict cross-site storage partitioning,
// dumping the user back on the login page with no error at all — exactly
// the bug redirect was supposed to dodge from popup-blocker issues).
// If the popup itself gets blocked, fall back to redirect as a last resort.
export async function loginWithGoogle() {
  try {
    return await signInWithPopup(auth, googleProvider);
  } catch (err) {
    if (err.code === "auth/popup-blocked" || err.code === "auth/cancelled-popup-request") {
      return signInWithRedirect(auth, googleProvider);
    }
    throw err;
  }
}

export function getRedirectRoundtripError() {
  return getRedirectResult(auth).catch((err) => err);
}

export function logout() {
  return signOut(auth);
}
