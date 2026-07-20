# Fieldsta

HVAC dispatch and job management for contractors. React + Vite + Firebase (Auth, Firestore, Storage), shadcn/ui-style components, mobile-first, deployable to Vercel.

Covers all four phases of the roadmap: job/customer/equipment management and dispatch (Phase 1–2), estimates/price book/real Stripe payments (Phase 3), and route planning/reporting/customer portal (Phase 4). Online payments run on real Cloud Functions (see "Stripe payments"); a couple of other Phase 4 items are still honest approximations — see "Known limitations" below.

## Features

**Module 1 — Customer & Job Management**
- Customer profiles (name, phone, email, address, preferred contact, notes)
- Equipment tracking per customer (make, model, serial number, install date)
- Service history — every job auto-linked to the customer record
- Work orders with job type (Install/Repair/Maintenance) and priority (Emergency/Standard)
- Full status pipeline: New → Scheduled → Dispatched → In Progress → On Hold → Completed → Invoiced
- Activity timeline (notes + status-change log) on every job
- Photo attachments (uploaded to Firebase Storage)
- "Supplies Needed" checklist on jobs — one click sends unchecked items to Store Orders

**Module 2 — Scheduling & Dispatch**
- Dashboard: Today's, Tomorrow's, and This Week's jobs, with a "My Jobs" filter
- Visual Dispatch Board: drag-and-drop kanban across the status pipeline, filterable by technician
- Technician management: skills, certifications, availability (Available/On Route/On Site/On Break/Off)

**Module 3 — Field access (mobile-first, not a separate app)**
- The whole app is mobile-first and installable-feeling on a phone; "My Jobs" on the dashboard gives technicians a filtered view of just their assignments
- One-tap status updates from Job Detail
- Photo capture from the phone camera when attaching to a job

**Module 6 — Store synergy**
- Store Orders admin page (for the hardware-store side of the business)
- Job supply checklists feed directly into Store Orders, linked back to the originating job

**Module 3 (cont.) — Route planning**
- "My Route": a technician's jobs for a chosen day, drag-to-reorder, one tap to open the whole stop list as a multi-stop Google Maps route

**Module 4 — Financials & Estimates**
- Price Book: centralized parts/materials/labor rates, editable inline
- Estimates with Good/Better/Best pricing tiers built from the Price Book or custom lines; print/share, then "Accept & Convert to Job" turns the chosen tier straight into a work order
- Print-friendly Invoice Preview per job, including payment history and balance due
- Manual payment recording (cash/check/card-present/online) with running paid/balance totals and an automatic paid/partial/unpaid status
- "Request Online Card Payment" creates a real Stripe Checkout link (via a Cloud Function) for the job's balance — text/email it to the customer and the payment is recorded here automatically once they pay. Requires a one-time Stripe setup — see "Stripe payments" below.

**Module 5 — Reporting & Analytics**
- Revenue by month, technician utilization, and top customers by revenue (bar charts)
- Approximate first-time fix rate and average days-to-complete for finished jobs

**Module 6 — Store synergy**
- Store Orders admin page (for the hardware-store side of the business)
- Job supply checklists feed directly into Store Orders, linked back to the originating job

**Customer self-service portal**
- Shareable, no-login link per customer (`/portal/<token>`) showing their jobs, statuses, and balances due

**Installable / offline (PWA)**
- "Add to Home Screen" on Android/desktop Chrome shows an install prompt automatically; iOS Safari doesn't support that prompt, so on iPhone it's Share → Add to Home Screen
- Firestore's local cache keeps previously loaded jobs/customers visible when a technician loses signal in the field, with writes queued to sync once back online
- An amber banner appears when offline so it's clear data might be stale, not broken

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com) and create a project.
2. Enable **Authentication → Sign-in method → Google**.
3. Also enable **Authentication → Sign-in method → Phone**. This gates company creation/joining — see "Phone verification" below — and requires the project to be on the **Blaze (pay-as-you-go) plan** since it sends real SMS (a handful of verification texts a day costs pennies; Cloud Functions already require Blaze anyway).
4. Enable **Firestore Database** (start in production mode).
5. Enable **Storage** (used for job photo attachments).
6. Add a **Web app** and copy the config values.

### 3. Configure environment variables

```bash
cp .env.example .env
```

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

Admin access (Dispatch Board, Technicians, Price Book, Store Orders, Reports, Team) is no longer driven by an env var — it's multi-tenant now. See "Multi-tenancy" below.

### 4. Deploy Firestore & Storage rules

```bash
npm install -g firebase-tools
firebase login
firebase init firestore storage   # point at this project, keep firestore.rules / storage.rules
firebase deploy --only firestore:rules,storage
```

### 5. Run locally

```bash
npm run dev
```

### 6. Deploy to Vercel

1. Push this repo to GitHub.
2. Import it in [Vercel](https://vercel.com/new).
3. Add the same `VITE_*` environment variables in Vercel project settings.
4. Deploy — Vercel auto-detects Vite (`npm run build`, output `dist`).

Add your Vercel domain (and `localhost`) to **Firebase Auth → Settings → Authorized domains**.

## Multi-tenancy

Fieldsta is a multi-tenant SaaS app: each subscribing company's data is isolated from every other company's. This is enforced two ways — at the app level (every query is filtered to the signed-in user's company) and, more importantly, at the Firestore/Storage security-rules level (a user physically cannot read or write another company's documents, regardless of what the client code does).

**`companies/{companyId}`**
```
name, ownerUid, createdAt
```

**`companies/{companyId}/invites/{email}`** (subcollection — pending teammate invites, doc ID is the invitee's lowercased email)
```
email, role ("admin"|"technician"), createdAt
```

**`users/{uid}`** (doc ID is the Firebase Auth UID — maps a signed-in user to their company + role)
```
companyId, role ("owner"|"admin"|"technician"), name, email, createdAt
```

Every document below also carries a `companyId` field pointing at the `companies/{companyId}` it belongs to, and every list query in the app filters on it.

**New sign-in flow:** after signing in with Google, a user with no `users/{uid}` doc is routed to `/setup-company`, where they first verify a phone number (see "Phone verification" below), then either create a brand-new company (becoming its "owner") or join an existing one by entering the company's ID plus having a pending invite waiting for their email (sent from the admin-only `/team` page). "Owner" and "admin" roles get access to Dispatch, Technicians, Price Book, Store Orders, Reports, and Team; "technician" is a normal crew member.

**Migration note:** any test data created before multi-tenancy (a handful of customers, most likely) has no `companyId` and will become invisible under the new rules — it isn't deleted, just orphaned. Easiest fix is to just re-enter that handful of records once you've created your real company; there's no bulk migration script for this since it wasn't worth building for such a small amount of test data.

## Phone verification

Before a signed-in Google account can create or join a company, `/setup-company` requires it to link a real, SMS-verified phone number (`src/lib/firebase.js` → `sendPhoneVerificationCode` / `confirmPhoneVerificationCode`, using Firebase's `linkWithPhoneNumber` on the already-signed-in user, plus an invisible reCAPTCHA in a `#recaptcha-container` div on the page).

This exists for two reasons: it's a real cost (a few seconds and a live SMS) that a throwaway or fake signup won't bother paying, and it gives you an actual "who is who" record — every company doc gets an `ownerPhone` field and every `users/{uid}` doc gets a `phone` field, both pulled straight from Firebase's verified `auth.currentUser.phoneNumber`, never typed freeform into a form.

**Requires:** the Phone sign-in provider enabled in Firebase Console (see Setup step 2 above) and the project on the Blaze plan. Without it, `sendPhoneVerificationCode` will fail — the person gets stuck on the verification screen with an error instead of silently getting through, which is the correct failure mode for a gate like this (fail closed, not open).

Numbers without a `+` country code are assumed US/Canada (`+1`); anyone outside that can type their own `+` prefix.

## Stripe payments

"Request Online Card Payment" is backed by two real Cloud Functions in `functions/`:

- **`createCheckoutSession`** (callable) — a signed-in user asks for a payment link for a job. The function re-checks server-side that the job belongs to the caller's company (never trusts the client), then creates a Stripe Checkout Session for the outstanding balance and returns the hosted payment URL.
- **`stripeWebhook`** (HTTP endpoint) — Stripe calls this when the customer actually pays. It verifies the request really came from Stripe (signature check), then writes the payment into the job's `paymentsLog` and posts a note to the job's activity feed. It's idempotent — a redelivered webhook event won't double-record the payment.

The Stripe secret key and webhook signing secret live only in Firebase's Secret Manager, never in the client bundle or `.env`.

### One-time setup (only you can do this part — it needs your own Stripe account)

1. **Create a Stripe account** at [stripe.com](https://stripe.com) if you don't have one. You can do all of this in **test mode** first and flip to live mode later without changing any code.
2. **Get your secret key**: Stripe Dashboard → Developers → API keys → copy the **Secret key** (`sk_test_...` or `sk_live_...`).
3. **Install the Cloud Functions dependencies:**
   ```bash
   cd functions
   npm install
   cd ..
   ```
4. **Set the app's base URL** (used for the Checkout success/cancel redirect). Create `functions/.env` (not committed):
   ```
   APP_URL=https://your-deployed-app.vercel.app
   ```
   Use `http://localhost:5173` here while testing locally.
5. **Store the Stripe secret key** in Firebase Secret Manager (this prompts you to paste the key — it's never written to a file in this repo):
   ```bash
   npx firebase-tools functions:secrets:set STRIPE_SECRET_KEY
   ```
6. **Deploy the functions** (requires the Blaze/pay-as-you-go plan, same as Storage):
   ```bash
   npx firebase-tools deploy --only functions
   ```
   Note the deployed URL for `stripeWebhook`, e.g. `https://us-central1-hvac-87a3c.cloudfunctions.net/stripeWebhook`.
7. **Register the webhook in Stripe**: Dashboard → Developers → Webhooks → Add endpoint → paste that URL → select events `checkout.session.completed` and `checkout.session.async_payment_succeeded`.
8. **Copy the webhook's signing secret** (starts `whsec_...`, shown after creating the endpoint) and store it the same way:
   ```bash
   npx firebase-tools functions:secrets:set STRIPE_WEBHOOK_SECRET
   npx firebase-tools deploy --only functions
   ```
   (Redeploy after adding a secret so the function picks it up.)

### Testing it end-to-end

- In Stripe test mode, use card `4242 4242 4242 4242`, any future expiry, any CVC.
- Or use the [Stripe CLI](https://stripe.com/docs/stripe-cli) to forward webhook events to a local emulator: `stripe listen --forward-to <your-function-url>`.
- Click "Request Online Card Payment" on a job with a balance due, complete the test payment, and confirm the payment shows up in the job's payment history within a few seconds (the app polls briefly after returning from Stripe).

### Notes

- If Cloud Functions aren't deployed yet, "Request Online Card Payment" fails gracefully with a message pointing back here instead of hanging or crashing.
- Switching from test mode to live mode is just swapping `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` for your live-mode values and re-registering the webhook endpoint against live mode — no code changes.
- Firestore rules already deny direct client access to the `stripeEvents/{eventId}` bookkeeping collection the webhook uses for idempotency — only the Cloud Function (via the Admin SDK, which bypasses rules) can touch it.

## Subscription billing & access

Fieldsta is $49/mo per company (owner + 1 teammate included), plus $15/mo for each additional teammate beyond that — computed server-side from the actual `users` count for a company, never trusted from the client.

**Access states**, stored as `plan` on the `companies/{companyId}` doc:

- `trial` — every new company starts here, with `trialEndsAt` set 14 days out at creation (`CompanySetup.jsx`). Full access during the trial.
- `active` — a real Stripe subscription is live. Set automatically by the Stripe webhook.
- `comped` — free forever, for hand-picked accounts (see below). Never touches Stripe.
- `past_due` — the subscription lapsed (failed payment, canceled). Blocks access.

`AuthContext.planActive` computes whether the signed-in company currently has access; `App.jsx`'s `RequirePlan` wrapper redirects anywhere else in the app to `/billing` if it's false. `/billing` itself is always reachable so a blocked company can still pay.

### Comping an account for free

Two ways to give someone free access, both landing on the same `plan: "comped"` state:

**Manual (any time, no code needed)** — for a company that already exists:
1. Open the Firebase Console → Firestore → `companies` → the contractor's company doc.
2. Set `plan` to `"comped"`.

That's it. Everyone on that company's team automatically gets free access too, since access is gated per-company, not per-user. To revoke, change `plan` back to `"trial"` or `"past_due"` — this is also how you end someone's comped access whenever you want, since a code being spent doesn't create any ongoing entitlement beyond what's stored on the company doc.

**Access codes (hand out ahead of time)** — for someone who hasn't signed up yet:
1. Firebase Console → Firestore → create a doc in an `accessCodes` collection, with the code itself as the document ID (e.g. `FIELDSTA-PA01`), and one field: `active` (boolean) set to `true`.
2. Give that code to the contractor. On the "Create company" screen, there's an optional "Access code" field — entering a valid, unused code makes their company start out `comped` instead of on the trial.
3. The code is automatically spent (flipped to `active: false`) the moment it's used, so it can't be reused elsewhere. It's single-use per company, not per-person — everyone on that company's team inherits the free access.

Note that deactivating a code (or it being spent) only affects *future* signups — it does not revoke access for a company that already redeemed it. To end an already-comped company's access, use the manual method above.

(Firestore rules block company admins from setting `plan`/`trialEndsAt`/Stripe fields themselves via a client update, and block setting `plan: "comped"` at company-creation time unless a live, unused access code is referenced — only the Firebase Console (your own Admin access), the Stripe webhook via the Admin SDK, or a valid access code redemption can grant comped/active status. This stops a company from just granting itself free access.)

### One-time setup for real subscription payments

1. In the Stripe Dashboard → Product catalog, create two **recurring** Prices:
   - Base plan — $49.00/mo, recurring monthly.
   - Per-seat add-on — $15.00/mo, recurring monthly.
2. Copy each Price ID (starts with `price_...`) into `functions/.env.<project-alias>`:
   ```
   STRIPE_BASE_PRICE_ID=price_xxxxxxxxxxxx
   STRIPE_SEAT_PRICE_ID=price_xxxxxxxxxxxx
   ```
3. In your Stripe webhook endpoint settings (the same endpoint already registered for job payments), make sure these events are also selected: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`.
4. Redeploy: `npx firebase-tools deploy --only functions`.

Once that's done, the "Subscribe" button on `/billing` (owner/admin only) creates a real Stripe Checkout session sized to the company's current team size and redirects there.

## AI Quick Note

Job Detail has a "Quick Note (AI)" card: type or dictate a messy field note and it's sent to a Cloud Function (`parseQuickNote`) that turns it into structured suggestions — a clean activity-log entry, any refrigerant add/recovery it can find, and follow-up ideas it deliberately leaves for you to act on (like "create an estimate"). **It never writes anything on its own** — you see a checklist preview and click "Apply Selected" to actually save anything, same trust model as the Stripe payment flow.

### One-time setup (only you can do this part — it needs your own Anthropic API key)

1. **Get an API key** from [console.anthropic.com](https://console.anthropic.com) → API Keys. Any account with credits works — it doesn't need to be a fresh one.
2. **Store it in Firebase Secret Manager:**
   ```bash
   npx firebase-tools functions:secrets:set ANTHROPIC_API_KEY
   ```
3. **Redeploy functions:**
   ```bash
   npx firebase-tools deploy --only functions
   ```

That's it — no webhook to register this time, since the AI call happens synchronously inside `parseQuickNote` itself.

### Notes

- Uses `claude-haiku-4-5-20251001` — fast and inexpensive, appropriate for a short extraction task like this. Each Quick Note call is one small API request.
- If the secret isn't set yet, "Parse with AI" fails with a message pointing back here instead of hanging.
- The function double-checks server-side that the job you're taking notes on actually belongs to your company before calling the AI at all — same pattern as the Stripe functions.

### Price book import (PDF/CSV → price book)

Both the Price Book page ("Import" button) and the Assistant page (paperclip icon) can take an uploaded supplier price sheet (PDF) or spreadsheet export (CSV), upload it to Storage under `priceBookImports/{companyId}/`, and hand it to `parsePriceBookFile` — another endpoint in the same `functions/index.js`, using the same `ANTHROPIC_API_KEY` secret, so there's nothing extra to configure beyond what's above. It returns proposed `{name, category, unitPrice, unit}` line items for the admin to check off and edit before anything is written to Firestore — same "propose, never auto-write" pattern as the rest of the assistant. Excel files (.xlsx) aren't parsed directly yet — export to CSV first.

Since this ships in the same `functions/index.js` as everything else, redeploying functions (`npx firebase-tools deploy --only functions`) picks it up automatically — no separate setup step.

## HVAC-specific features

Two things generalist field-service tools (ServiceTitan, Housecall Pro, Jobber) don't do well for HVAC specifically:

- **EPA Section 608 refrigerant tracking.** As of the January 2026 AIM Act threshold change, appliances holding 15+ lbs of an HFC refrigerant require documented recordkeeping (type, pounds added/recovered, leak test results) — penalties run up to ~$124k/day for non-compliance. Equipment records on Customer Detail take a refrigerant type + charge weight and show an "EPA 608" badge once at/above 15 lbs. Job Detail has a Refrigerant Log card where a tech records each add/recovery with a leak test result and their cert number, which also posts to the job's activity feed.
- **Maintenance agreements.** A dedicated `/agreements` page for the seasonal tune-up contracts (spring AC / fall furnace) that are the real recurring-revenue backbone of an HVAC shop — something Fieldsta didn't have as a first-class concept before. Create an agreement per customer with a frequency (quarterly/twice-yearly/annual) and price; "Schedule Visit" creates the job and automatically pushes the next due date forward. The Dashboard surfaces an amber banner when visits are overdue or due within 30 days.
- **System-level equipment detail.** Equipment records track system type (split/heat pump/packaged/mini-split/geothermal), tonnage (with BTU shown automatically), filter size, and warranty expiration — with a badge when a warranty is expiring within 90 days, alongside the existing EPA 608 badge.
- **Technician certifications, on-call, and truck stock.** Beyond general skills, technicians now track EPA 608 certification + expiration, NATE certification, on-call/emergency-rotation status, and a running list of parts they carry on their truck.
- **Job diagnosis codes.** Jobs carry a structured diagnosis category (low refrigerant, compressor failure, capacitor, thermostat, fan motor, coil leak, electrical, drain clog) alongside the free-text description, for pattern-spotting on what actually breaks most.

## Localization

Fieldsta is fully bilingual (English/Spanish) — every screen, not just headers, including status labels, error messages, and AI-generated text. This isn't a generic nicety: Perth Amboy, NJ, where this app is being piloted, is roughly 80% Hispanic or Latino by Census data, so this is aimed at the actual first users, not a hypothetical future market.

- `src/lib/translations.js` — flat `en`/`es` dictionary, namespaced by page (`"jobDetail.saveChanges"`, `"status.in-progress"`, etc.)
- `src/context/LanguageContext.jsx` — `useLanguage()` returns `{ lang, setLang, t }`; `t(key, vars)` supports `{placeholder}` interpolation and persists the choice in `localStorage`
- A toggle button switches languages instantly, no reload — visible on the Login screen (before auth) and in the app header (after auth)
- Firestore-stored values (`status`, `jobType`, `priority`, etc.) stay as stable English codes internally; only the *displayed* label changes with language, so switching languages never touches stored data

## Data model (Firestore)

**`companies/{id}`**
```
name, ownerUid, createdAt,
plan ("trial"|"active"|"comped"|"past_due"), trialEndsAt (Timestamp),
stripeCustomerId, stripeSubscriptionId, subscriptionStatus
```
See "Subscription billing & access" above for how `plan` gates app access.

**`customers/{id}`**
```
companyId, name, phone, email, address, preferredContact ("phone"|"email"|"text"), notes, createdAt
```

**`equipment/{id}`**
```
companyId, customerId, make, model, serialNumber, installDate,
systemType ("split"|"heat-pump"|"packaged"|"mini-split"|"geothermal"), tonnage, filterSize,
warrantyExpirationDate, refrigerantType (e.g. "R-410A"), refrigerantCapacityLbs, notes, createdAt
```
Equipment holding 15+ lbs of refrigerant gets an "EPA 608" badge; a warranty within 90 days of expiring (or already expired) gets its own badge — see "HVAC-specific features" below.

**`maintenanceAgreements/{id}`**
```
companyId, customerId, customerName, customerPhone, customerAddress,
equipmentLabel, frequency ("quarterly"|"biannual"|"annual"), price, notes,
active, nextDueDate (Timestamp), lastScheduledAt (Timestamp|null), createdAt, createdBy
```

**`technicians/{id}`**
```
companyId, name, email, phone, skills: string[], certifications: string[],
availability ("available"|"on-route"|"on-site"|"on-break"|"off"),
epaCertified, epaCertExpiration, nateCertified, onCall, truckStock: string[], createdAt
```
`email` should match the technician's Google login — it's how "My Jobs" on the Dashboard filters to their assignments.

**`jobs/{id}`**
```
companyId, customerId, customerName, phone, address,
jobType ("install"|"repair"|"maintenance"), priority ("emergency"|"standard"),
description, diagnosisCode ("low-refrigerant"|"compressor-failure"|"capacitor-bad"|"thermostat-malfunction"|"fan-motor-failure"|"coil-leak"|"electrical-issue"|"drain-clog"|"other"),
status ("new"|"scheduled"|"dispatched"|"in-progress"|"on-hold"|"completed"|"invoiced"),
technicianId, technicianName, technicianEmail,
scheduledAt (Timestamp), price, supplies: [{item, qty, checked}], photos: string[],
refrigerantLog: [{type, action ("added"|"recovered"), pounds, leakTestResult ("pass"|"fail"|"n/a"), technicianCertNumber, recordedBy, date}],
paymentStatus ("unpaid"|"partial"|"paid"),
paymentsLog: [{amount, method, note, recordedBy, date}],
notes, createdAt, createdBy, updatedAt
```

**`jobs/{id}/activity/{id}`** (subcollection — the note/status timeline)
```
companyId, type ("note"|"status-change"), text, author, createdAt
```

**`storeOrders/{id}`**
```
companyId, item, quantity, notes, status ("pending"|"ordered"|"received"),
requestedBy, jobId (nullable — set when sent from a job's supply checklist), createdAt
```

**`priceBook/{id}`**
```
companyId, name, category ("labor"|"part"|"material"|"fee"), unitPrice, unit, notes, createdAt
```

**`estimates/{id}`**
```
companyId, customerId, customerName, status ("draft"|"sent"|"accepted"|"declined"),
selectedTier ("good"|"better"|"best"|""), jobId (set once converted),
tiers: { good: {label, items: [{name, qty, unitPrice}], total}, better: {...}, best: {...} },
notes, createdAt, createdBy, updatedAt
```

**`routes/{technicianId_date}`**
```
companyId, technicianId, date ("YYYY-MM-DD"), jobIds: string[] (drive order), updatedAt
```

**`portal/{token}`** (denormalized snapshot backing the customer self-service link — intentionally NOT company-scoped, see "Customer portal security" below)
```
customerId, customerName, generatedAt,
jobs: [{id, description, status, scheduledAt, price, balanceDue}]
```

## Project structure

```
src/
  components/
    ui/            shadcn-style primitives (button, card, input, label, textarea,
                    select, badge, dialog, checkbox)
    Layout.jsx      app shell (header + nav + outlet)
    NavBar.jsx      bottom nav on mobile, top nav on desktop; admin links only for owner/admin roles
  context/
    AuthContext.jsx  user + companyId/role, fetched from users/{uid}
  lib/
    firebase.js     Firebase init (Auth, Firestore, Storage)
    utils.js        cn(), date/currency formatting, status/priority label maps
  pages/
    Login.jsx
    CompanySetup.jsx      create-company or join-by-invite flow for brand-new sign-ins
    Team.jsx               invite/manage teammates, view company ID (admin)
    Dashboard.jsx        Today/Tomorrow/This Week + My Jobs filter
    AddJob.jsx           job type, priority, technician assignment, supplies checklist
    JobDetail.jsx         status pipeline, activity timeline, photo upload, supplies → Store Orders
    CustomerList.jsx      searchable customer list
    CustomerDetail.jsx    profile edit, equipment tracking, service history
    DispatchBoard.jsx     drag-and-drop kanban by status, technician filter (admin)
    Technicians.jsx        skills, certifications, availability (admin)
    StoreOrders.jsx        parts/supplies requests (admin)
    InvoicePreview.jsx     print-friendly invoice, payment history, balance due
    PriceBook.jsx           parts/materials/labor rate list (admin)
    Estimates.jsx           list of estimates
    MaintenanceAgreements.jsx  seasonal tune-up contracts, schedule-next-visit
    EstimateDetail.jsx      Good/Better/Best builder, print, accept-to-job conversion
    MyRoute.jsx             a technician's day, drag-to-reorder, open in Google Maps
    Reports.jsx             revenue, utilization, first-time fix rate charts (admin)
    CustomerPortal.jsx      public /portal/:token page, no login required
  App.jsx
  main.jsx
functions/
  index.js         createCheckoutSession (callable) + stripeWebhook (HTTP) — see "Stripe payments"
  package.json      firebase-admin, firebase-functions, stripe
```

## Notes

- The `ui/` components are hand-written to match shadcn/ui's API and Tailwind conventions, since the shadcn CLI can't run in this environment. `npx shadcn@latest add <component>` against the same `components.json` will work later and can replace/extend these files.
- The Dispatch Board uses native HTML5 drag-and-drop (no extra dependency). Dragging a card between columns updates the job's `status` directly.
- Any signed-in member of a company can read/write that company's jobs, customers, and equipment. Dispatch Board, Technicians, Price Book, Store Orders, Reports, and Team are gated to the "owner"/"admin" roles on that company.
- Firestore composite index: the Dashboard query filters `scheduledAt` with a range and orders by `scheduledAt`. Firestore will prompt with a direct link to create the index the first time you run this query if one's needed. Reports also runs a `collectionGroup('activity')` query — Firestore will similarly prompt for that index the first time it runs.
- Charts on the Reports page use [Recharts](https://recharts.org), added as a normal npm dependency (no design-system integration needed beyond the existing `card` primitive).
- PWA support comes from `vite-plugin-pwa` (configured in `vite.config.js`) plus generated icons in `public/icons/`. It precaches the app shell for instant/offline loading; it does not cache Firestore data itself — that's handled separately by Firestore's own `persistentLocalCache` (see `src/lib/firebase.js`), which is what actually lets a technician view previously loaded jobs with no signal.

## Known limitations (and how to close them)

These are the places where a fully backend-free app hits a real wall. Each is implemented as a working, honest approximation rather than a fake "done" button:

- **Online card payments — done, not a stub.** "Request Online Card Payment" creates a real Stripe Checkout session via a Cloud Function and records the payment automatically via a verified webhook — see "Stripe payments" above for the one-time setup only you can do (it needs your own Stripe account). "Record Payment" still exists alongside it for cash/check/card-present payments taken in person.
- **Route optimization.** "My Route" gives you manual drag-to-reorder plus a one-tap multi-stop Google Maps link in that order — genuinely useful, but it's not automatic shortest-path optimization. True optimization needs the Google Maps **Directions API** (or a routing service) with an API key and billing enabled, called from a small backend or Cloud Function so the key isn't exposed client-side.
- **First-time fix rate & completion time (Reports).** These are approximations: first-time fix rate treats "never logged an On Hold status change" as a proxy for not needing a return visit, and completion time uses `updatedAt - createdAt` on the job rather than a dedicated "job closed" timestamp. Good enough to spot trends; not audit-grade.
- **Customer portal security.** The portal link's security relies on the token being a long, unguessable random ID (Firestore rules allow `get` but never `list` on that collection) — obscurity, not real authorization. It's a reasonable tradeoff for a small shop, but a production-grade version should have a Cloud Function mint a short-lived, verifiable token (or a Firebase Auth custom token) per request instead of a static one.
- **Price book / estimates don't sync back automatically.** Editing a price in the Price Book doesn't retroactively update estimates that already reference that item — estimates snapshot the price at the time it was added, which is usually what you want for a quote that's already gone out, but worth knowing.
