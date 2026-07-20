import { initializeApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  RecaptchaVerifier,
  linkWithPhoneNumber,
} from "firebase/auth";
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from "firebase/firestore";
import { getStorage, ref, uploadBytes } from "firebase/storage";
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
export function runAssistant(message, customers, jobs, history) {
  const call = httpsCallable(functions, "runAssistant");
  return call({ message, customers, jobs, history });
}

// Uploads a price sheet/catalog (PDF or CSV) to Storage, then asks
// parsePriceBookFile to turn it into structured {name, category, unitPrice,
// unit, notes} line items for the caller to review before anything is
// written to Firestore. Shared by the manual Price Book "Import" button and
// the Assistant page's file-attach flow, so both go through one code path.
export async function uploadAndParsePriceBookFile(file, companyId) {
  // Browsers/OSes are inconsistent about the .type they report for CSVs
  // (sometimes empty, sometimes application/vnd.ms-excel) — the Storage
  // rule and Cloud Function both key off contentType, so normalize by
  // extension rather than trusting file.type blindly.
  const isPdf = file.name.toLowerCase().endsWith(".pdf");
  const mimeType = isPdf ? "application/pdf" : "text/csv";

  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `priceBookImports/${companyId}/${Date.now()}_${safeName}`;
  const storageRef = ref(storage, storagePath);
  await uploadBytes(storageRef, file, { contentType: mimeType });
  const call = httpsCallable(functions, "parsePriceBookFile");
  const result = await call({ storagePath, mimeType });
  return result.data?.items || [];
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

// --- Phone verification (company setup gate) -------------------------
//
// Requires the "Phone" sign-in provider to be turned on in Firebase
// Console → Authentication → Sign-in method (and the project on the Blaze
// plan, since Phone Auth sends real SMS). See README "Phone verification".
//
// We link a phone credential onto the *already Google-signed-in* user
// (rather than signing in fresh with phone) so this is a verification step
// on top of an existing account, not a second login method — one real
// human, one Google account, one verified phone, all tied together. That's
// both the anti-fake-signup barrier and the "who is who" record the owner
// asked for: every company doc ends up with a real, SMS-verified phone
// number on it.
let recaptchaVerifier = null;

function getRecaptcha(containerId) {
  if (!recaptchaVerifier) {
    recaptchaVerifier = new RecaptchaVerifier(auth, containerId, { size: "invisible" });
  }
  return recaptchaVerifier;
}

// Sends a 6-digit SMS code to `phoneNumber` (E.164 format, e.g. +15551234567)
// and returns a confirmationResult to pass into confirmPhoneCode().
export async function sendPhoneVerificationCode(phoneNumber, containerId = "recaptcha-container") {
  const verifier = getRecaptcha(containerId);
  return linkWithPhoneNumber(auth.currentUser, phoneNumber, verifier);
}

// Confirms the code the person typed in against the confirmationResult from
// sendPhoneVerificationCode(). Throws (e.g. "auth/invalid-verification-code")
// if it doesn't match. On success, auth.currentUser.phoneNumber is set.
export async function confirmPhoneVerificationCode(confirmationResult, code) {
  return confirmationResult.confirm(code);
}
