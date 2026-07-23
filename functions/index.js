/**
 * Cloud Functions for Fieldsta — real Stripe Checkout payments.
 *
 * Two entry points:
 *   - createCheckoutSession (callable): a signed-in user asks for a payment
 *     link for a job's outstanding balance. We verify server-side that the
 *     job belongs to their company, create a Stripe Checkout Session, and
 *     hand back the hosted checkout URL to text/email to the customer.
 *   - stripeWebhook (HTTP): Stripe calls this when the customer actually
 *     pays. We verify the signature, then record the payment on the job
 *     and log it to the job's activity feed.
 *
 * A third entry point, parseQuickNote, turns a technician's freeform note
 * into structured suggestions (a clean activity-log note, refrigerant log
 * entries, follow-up ideas) using the Anthropic API. It never writes
 * anything itself — it only returns suggestions for the client to show the
 * user, who explicitly applies what they want.
 *
 * Secrets (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, ANTHROPIC_API_KEY) are
 * never touched by the client — they only exist here, loaded via Firebase's
 * Secret Manager integration. See README.md for setup of each.
 */

const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret, defineString } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const Stripe = require("stripe");

admin.initializeApp();
const db = admin.firestore();

const stripeSecretKey = defineSecret("STRIPE_SECRET_KEY");
const stripeWebhookSecret = defineSecret("STRIPE_WEBHOOK_SECRET");
const anthropicApiKey = defineSecret("ANTHROPIC_API_KEY");

// Base URL of the deployed web app, used to build the Stripe success/cancel
// redirect links. Set in functions/.env (not a secret — just config), e.g.
// APP_URL=https://fieldsta.vercel.app
const appUrl = defineString("APP_URL", { default: "http://localhost:5173" });

// Stripe Price IDs for the subscription plan, also set in functions/.env
// (not secrets — Price IDs aren't sensitive). See README.md "Subscription
// billing" for how to create these in the Stripe Dashboard:
//   STRIPE_BASE_PRICE_ID  — $49/mo, covers the owner + 1 teammate (qty 1)
//   STRIPE_SEAT_PRICE_ID  — per-teammate add-on beyond the first 2 users
const stripeBasePriceId = defineString("STRIPE_BASE_PRICE_ID", { default: "" });
const stripeSeatPriceId = defineString("STRIPE_SEAT_PRICE_ID", { default: "" });

// Referral reward: how much credit (in cents) a referrer earns each time
// someone they referred converts from trial to a paying subscription.
// Applied as a Stripe customer balance credit (see redeemReferralCredit),
// not an automatic discount — the referrer has to already be a Stripe
// customer (i.e. have paid at least once) for a balance credit to attach
// to anything, so credits queue up as `referralCreditsOwed` until then.
const referralCreditCents = defineString("REFERRAL_CREDIT_CENTS", { default: "4900" });

function computeBalanceDue(job) {
  const totalPaid = (job.paymentsLog || []).reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );
  const price = Number(job.price) || 0;
  return Math.round((price - totalPaid) * 100) / 100;
}

function nextPaymentStatus(paymentsLog, price) {
  const totalPaid = paymentsLog.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  if (totalPaid <= 0) return "unpaid";
  if (totalPaid >= price) return "paid";
  return "partial";
}

exports.createCheckoutSession = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in required.");
    }

    const jobId = request.data && request.data.jobId;
    if (!jobId || typeof jobId !== "string") {
      throw new HttpsError("invalid-argument", "jobId is required.");
    }

    // Look up the caller's company the same way the Firestore rules do —
    // never trust a companyId passed from the client.
    const userSnap = await db.doc(`users/${request.auth.uid}`).get();
    if (!userSnap.exists) {
      throw new HttpsError("permission-denied", "No company profile found for this account.");
    }
    const { companyId } = userSnap.data();

    const jobSnap = await db.doc(`jobs/${jobId}`).get();
    if (!jobSnap.exists) {
      throw new HttpsError("not-found", "Job not found.");
    }
    const job = jobSnap.data();
    if (job.companyId !== companyId) {
      throw new HttpsError("permission-denied", "This job doesn't belong to your company.");
    }

    const balanceDue = computeBalanceDue(job);
    if (balanceDue <= 0) {
      throw new HttpsError("failed-precondition", "This job has no outstanding balance.");
    }

    const stripe = new Stripe(stripeSecretKey.value(), { apiVersion: "2024-04-10" });

    const productName = `${job.customerName || "Customer"} — ${
      job.description || "HVAC service"
    }`.slice(0, 200);

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            unit_amount: Math.round(balanceDue * 100),
            product_data: { name: productName },
          },
          quantity: 1,
        },
      ],
      metadata: { jobId, companyId },
      success_url: `${appUrl.value()}/jobs/${jobId}?payment=success`,
      cancel_url: `${appUrl.value()}/jobs/${jobId}?payment=cancelled`,
    });

    return { url: session.url, balanceDue };
  }
);

// Subscription billing: creates a Stripe Checkout Session (mode:
// "subscription") for the calling company's plan. Pricing: a flat base
// price covering the owner + 1 teammate, plus a per-seat price for every
// additional teammate beyond that — computed server-side from the actual
// team size, never trusted from the client. Comped companies are blocked
// from ever reaching Stripe at all.
exports.createSubscriptionCheckout = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in required.");
    }

    const userSnap = await db.doc(`users/${request.auth.uid}`).get();
    if (!userSnap.exists) {
      throw new HttpsError("permission-denied", "No company profile found for this account.");
    }
    const { companyId, role } = userSnap.data();
    if (role !== "owner" && role !== "admin") {
      throw new HttpsError("permission-denied", "Only an owner or admin can manage billing.");
    }

    const companySnap = await db.doc(`companies/${companyId}`).get();
    if (!companySnap.exists) {
      throw new HttpsError("not-found", "Company not found.");
    }
    const company = companySnap.data();
    if (company.plan === "comped") {
      throw new HttpsError("failed-precondition", "This account already has free access — no need to pay.");
    }
    if (!stripeBasePriceId.value()) {
      throw new HttpsError(
        "failed-precondition",
        "Billing isn't configured yet — STRIPE_BASE_PRICE_ID hasn't been set."
      );
    }

    const usersSnap = await db.collection("users").where("companyId", "==", companyId).get();
    const seatCount = usersSnap.size;
    const extraSeats = Math.max(0, seatCount - 2); // base price already covers owner + 1 teammate

    const stripe = new Stripe(stripeSecretKey.value(), { apiVersion: "2024-04-10" });

    const line_items = [{ price: stripeBasePriceId.value(), quantity: 1 }];
    if (extraSeats > 0 && stripeSeatPriceId.value()) {
      line_items.push({ price: stripeSeatPriceId.value(), quantity: extraSeats });
    }

    const sessionParams = {
      mode: "subscription",
      payment_method_types: ["card"],
      line_items,
      client_reference_id: companyId,
      metadata: { companyId },
      subscription_data: { metadata: { companyId } },
      success_url: `${appUrl.value()}/billing?checkout=success`,
      cancel_url: `${appUrl.value()}/billing?checkout=cancelled`,
    };
    if (company.stripeCustomerId) {
      sessionParams.customer = company.stripeCustomerId;
    } else {
      sessionParams.customer_email = request.auth.token.email;
    }

    try {
      const session = await stripe.checkout.sessions.create(sessionParams);
      return { url: session.url, seatCount, extraSeats };
    } catch (err) {
      // Surface Stripe's actual error message to the client instead of a
      // generic "internal" — this is almost always either a bad/missing
      // Price ID or a Price ID from the wrong Stripe sandbox/mode.
      logger.error("Stripe subscription checkout failed", err);
      throw new HttpsError("internal", `Stripe error: ${err.message || "unknown error"}`);
    }
  }
);

// Applies any queued-up referral credits (see stripeWebhook) to the
// caller's actual Stripe subscription, as a customer balance credit that
// auto-applies to their next invoice. Only possible once they have a real
// Stripe customer (i.e. have subscribed at least once) — a credit can't
// attach to nothing, so this fails with a clear message until then rather
// than silently losing the credit; referralCreditsOwed stays put either way.
exports.redeemReferralCredit = onCall(
  { secrets: [stripeSecretKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in required.");
    }
    const userSnap = await db.doc(`users/${request.auth.uid}`).get();
    if (!userSnap.exists) {
      throw new HttpsError("permission-denied", "No company profile found for this account.");
    }
    const { companyId, role } = userSnap.data();
    if (role !== "owner" && role !== "admin") {
      throw new HttpsError("permission-denied", "Only an owner or admin can redeem referral credit.");
    }

    const companyRef = db.doc(`companies/${companyId}`);
    const companySnap = await companyRef.get();
    if (!companySnap.exists) {
      throw new HttpsError("not-found", "Company not found.");
    }
    const company = companySnap.data();
    const owed = Number(company.referralCreditsOwed) || 0;
    if (owed <= 0) {
      throw new HttpsError("failed-precondition", "No referral credit to redeem right now.");
    }
    if (!company.stripeCustomerId) {
      throw new HttpsError(
        "failed-precondition",
        "You need an active subscription before a credit can be applied — subscribe first, then come back to redeem."
      );
    }

    const stripe = new Stripe(stripeSecretKey.value(), { apiVersion: "2024-04-10" });
    const creditCents = owed * (Number(referralCreditCents.value()) || 0);
    try {
      await stripe.customers.createBalanceTransaction(company.stripeCustomerId, {
        amount: -creditCents, // negative = credit toward future invoices
        currency: "usd",
        description: `Referral credit — ${owed} referred compan${owed === 1 ? "y" : "ies"} converted to a paid plan`,
      });
      await companyRef.set({ referralCreditsOwed: 0 }, { merge: true });
      return { creditedCents: creditCents };
    } catch (err) {
      logger.error("Failed to apply referral credit", err);
      throw new HttpsError("internal", `Stripe error: ${err.message || "unknown error"}`);
    }
  }
);

exports.stripeWebhook = onRequest(
  { secrets: [stripeSecretKey, stripeWebhookSecret] },
  async (req, res) => {
    const stripe = new Stripe(stripeSecretKey.value(), { apiVersion: "2024-04-10" });
    const signature = req.headers["stripe-signature"];

    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.rawBody,
        signature,
        stripeWebhookSecret.value()
      );
    } catch (err) {
      logger.error("Stripe webhook signature verification failed", err.message);
      res.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }

    // Subscription lifecycle events: keep the company's plan/status in sync
    // whenever a subscription is created, changes (upgrade/downgrade/seat
    // count), or is canceled/lapses.
    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const sub = event.data.object;
      const companyId = sub.metadata && sub.metadata.companyId;
      if (!companyId) {
        res.status(200).send("no companyId on subscription, ignored");
        return;
      }
      const plan = ["active", "trialing"].includes(sub.status)
        ? "active"
        : sub.status === "canceled"
        ? "trial"
        : "past_due";
      try {
        await db.doc(`companies/${companyId}`).set(
          { plan, stripeSubscriptionId: sub.id, subscriptionStatus: sub.status },
          { merge: true }
        );
        res.status(200).send("ok");
      } catch (err) {
        logger.error("Failed to update company plan from subscription event", err);
        res.status(500).send("internal error");
      }
      return;
    }

    const relevantEvents = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];
    if (!relevantEvents.includes(event.type)) {
      res.status(200).send("ignored");
      return;
    }

    const session = event.data.object;

    // Subscription checkout (billing signup) vs. a one-off job-payment
    // checkout are both "checkout.session.completed" — tell them apart by
    // mode, since they update completely different documents.
    if (session.mode === "subscription") {
      const companyId = (session.metadata && session.metadata.companyId) || session.client_reference_id;
      if (!companyId) {
        res.status(200).send("no companyId on subscription checkout, ignored");
        return;
      }
      try {
        const companyRef = db.doc(`companies/${companyId}`);
        const companySnap = await companyRef.get();
        const company = companySnap.data() || {};

        await companyRef.set(
          {
            plan: "active",
            stripeCustomerId: session.customer,
            stripeSubscriptionId: session.subscription,
          },
          { merge: true }
        );

        // First real conversion — if this company was referred by another
        // one and hasn't already triggered a credit (Stripe can redeliver
        // this event), queue a credit on the referrer and leave a visible
        // record they can see on their own Team page.
        if (company.referredBy && !company.referralCredited) {
          const referrerRef = db.doc(`companies/${company.referredBy}`);
          const creditCents = Number(referralCreditCents.value()) || 0;
          await db.runTransaction(async (tx) => {
            const referrerSnap = await tx.get(referrerRef);
            if (!referrerSnap.exists) return;
            tx.set(
              referrerRef,
              { referralCreditsOwed: admin.firestore.FieldValue.increment(1) },
              { merge: true }
            );
            tx.set(referrerRef.collection("referrals").doc(companyId), {
              companyName: company.name || "A referred company",
              creditCents,
              convertedAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          });
          await companyRef.set({ referralCredited: true }, { merge: true });
        }

        res.status(200).send("ok");
      } catch (err) {
        logger.error("Failed to activate company plan from subscription checkout", err);
        res.status(500).send("internal error");
      }
      return;
    }

    const jobId = session.metadata && session.metadata.jobId;
    if (!jobId) {
      logger.warn("Stripe event missing jobId metadata", event.id);
      res.status(200).send("no jobId, ignored");
      return;
    }

    // Stripe may retry/redeliver the same event — guard against double-
    // recording the same payment.
    const processedRef = db.doc(`stripeEvents/${event.id}`);
    const jobRef = db.doc(`jobs/${jobId}`);

    try {
      await db.runTransaction(async (tx) => {
        const [processedSnap, jobSnap] = await Promise.all([tx.get(processedRef), tx.get(jobRef)]);
        if (processedSnap.exists) return; // already handled this event
        if (!jobSnap.exists) return;

        const job = jobSnap.data();
        const amount = (session.amount_total || 0) / 100;
        const entry = {
          amount,
          method: "online",
          note: "Paid via Stripe Checkout",
          recordedBy: "stripe-webhook",
          date: new Date().toISOString(),
        };
        const newLog = [...(job.paymentsLog || []), entry];
        const price = Number(job.price) || 0;
        const newStatus = nextPaymentStatus(newLog, price);

        tx.update(jobRef, { paymentsLog: newLog, paymentStatus: newStatus });

        const activityRef = jobRef.collection("activity").doc();
        tx.set(activityRef, {
          type: "note",
          text: `Payment received online: $${amount.toFixed(2)} via Stripe`,
          author: "Stripe",
          companyId: job.companyId,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        tx.set(processedRef, {
          jobId,
          amount,
          processedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      });

      res.status(200).send("ok");
    } catch (err) {
      logger.error("Failed to record Stripe payment", err);
      // 500 so Stripe retries delivery.
      res.status(500).send("internal error");
    }
  }
);

const QUICK_NOTE_SYSTEM_PROMPT = `You help HVAC technicians turn a quick, messy, spoken-or-typed field note into structured job data. You do not take any action yourself — you only extract structured suggestions for a human to review and approve.

Respond with ONLY a JSON object (no markdown fencing, no commentary before or after) matching exactly this shape:
{
  "noteText": string or null,
  "refrigerant": [{"type": string, "action": "added" or "recovered", "pounds": number, "leakTestResult": "pass" or "fail" or "n/a"}],
  "suggestions": [string]
}

Rules:
- "noteText": a clean, professional one-or-two sentence summary of what the technician did, suitable to post directly as a job activity log entry. Use null if the note has nothing log-worthy in it.
- "refrigerant": one entry per distinct refrigerant add or recovery clearly mentioned, with a specific number of pounds. Do not guess a pounds value if none is stated — omit that entry instead. Empty array if nothing refrigerant-related is mentioned.
- "suggestions": short, actionable follow-up items a human should decide on themselves — e.g. "Create an estimate for a new furnace", "Schedule a follow-up visit". Never include something you already captured in noteText or refrigerant. Empty array if there's nothing to suggest.
- Output nothing but the JSON object. No prose.`;

exports.parseQuickNote = onCall(
  { secrets: [anthropicApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in required.");
    }

    const text = request.data && request.data.text;
    const jobId = request.data && request.data.jobId;
    if (!text || typeof text !== "string" || !text.trim()) {
      throw new HttpsError("invalid-argument", "text is required.");
    }

    const userSnap = await db.doc(`users/${request.auth.uid}`).get();
    if (!userSnap.exists) {
      throw new HttpsError("permission-denied", "No company profile found for this account.");
    }
    const { companyId } = userSnap.data();

    let jobContext = "";
    if (jobId) {
      const jobSnap = await db.doc(`jobs/${jobId}`).get();
      if (!jobSnap.exists || jobSnap.data().companyId !== companyId) {
        throw new HttpsError("permission-denied", "This job doesn't belong to your company.");
      }
      const job = jobSnap.data();
      jobContext = ` Job context: customer "${job.customerName || "unknown"}", job description "${
        job.description || ""
      }".`;
    }

    let anthropicRes;
    try {
      anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": anthropicApiKey.value(),
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001",
          max_tokens: 500,
          system: QUICK_NOTE_SYSTEM_PROMPT + jobContext,
          messages: [{ role: "user", content: text.trim() }],
        }),
      });
    } catch (err) {
      logger.error("Anthropic request failed to send", err);
      throw new HttpsError("unavailable", "Couldn't reach the AI service. Try again.");
    }

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      logger.error("Anthropic API error", anthropicRes.status, errBody);
      if (anthropicRes.status === 401) {
        throw new HttpsError("failed-precondition", "AI service rejected the API key — check ANTHROPIC_API_KEY.");
      }
      throw new HttpsError("internal", "AI request failed.");
    }

    const data = await anthropicRes.json();
    const raw = (data.content && data.content[0] && data.content[0].text) || "{}";

    let parsed;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch (err) {
      logger.warn("Couldn't parse AI response as JSON, falling back to raw note", raw);
      parsed = { noteText: text.trim(), refrigerant: [], suggestions: [] };
    }

    return {
      noteText: typeof parsed.noteText === "string" ? parsed.noteText : null,
      refrigerant: Array.isArray(parsed.refrigerant) ? parsed.refrigerant : [],
      suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
    };
  }
);

const ASSISTANT_SYSTEM_PROMPT = `You are the Fieldsta assistant, a fast, sharp helper for HVAC contractors and their office staff. A technician or office admin describes something in plain language, and you turn it into a list of proposed structured actions. You do not perform any action yourself — the app shows your proposal to the human, who edits and confirms before anything is saved.

You'll see the full conversation so far. Use it: if someone says "add another one for the same guy" or "actually make it emergency priority" or "yes, do that", resolve it against what was just discussed instead of asking them to repeat themselves.

Write "reply" with a genuinely jolly, upbeat personality — you're a friendly mascot, not a form letter or a stiff corporate bot. Warm, a little playful, the occasional exclamation point or light bit of enthusiasm is welcome ("Got it — Smith's AC repair is on the books for 2pm tomorrow!"). But stay useful and brief: cheerful doesn't mean rambling, and never let the personality get in the way of being clear about what you did or didn't understand. If you propose nothing, say plainly (and still warmly) why — e.g. "Almost there! Just need a name or address for that job — who's it for?" — instead of a flat non-answer.

You'll be given a JSON list of the company's existing customers and recent jobs, each with an id. Use those ids when you're confident which customer/job the person means. If you're not confident, leave the id fields null and fill in your best guess of the name/description as text instead — the app will let the human pick manually.

Respond with ONLY a JSON object (no markdown fencing, no commentary) matching exactly this shape:
{
  "reply": string,
  "actions": [ ... ]
}

"reply" is one short, friendly sentence acknowledging what you understood.

Each item in "actions" must have a "type" field set to one of:
- "create_customer": {"type": "create_customer", "name": string, "phone": string, "email": string, "address": string}
- "create_job": {"type": "create_job", "customerId": string or null, "customerName": string, "phone": string, "address": string, "jobType": "install" or "repair" or "maintenance", "priority": "standard" or "emergency", "description": string, "scheduledDate": "YYYY-MM-DD" or null, "scheduledTime": "HH:MM" or null, "price": number or null}
- "log_payment": {"type": "log_payment", "jobId": string or null, "jobLabel": string, "amount": number, "method": "cash" or "check" or "card" or "online", "note": string}
- "log_refrigerant": {"type": "log_refrigerant", "jobId": string or null, "jobLabel": string, "refType": string, "action": "added" or "recovered", "pounds": number, "leakTestResult": "pass" or "fail" or "n/a"}
- "create_maintenance_agreement": {"type": "create_maintenance_agreement", "customerId": string or null, "customerName": string, "frequency": "quarterly" or "biannual" or "annual", "price": number, "equipmentLabel": string}
- "add_note": {"type": "add_note", "jobId": string or null, "jobLabel": string, "text": string}

Rules:
- Only include actions the person's message actually asked for or clearly described. Don't invent extra work.
- "jobLabel" / "customerName" should be a short human-readable description (e.g. "Smith AC repair" or "John Smith") to help the human pick the right one if the id is null.
- For dates, if the person says "tomorrow" or "next Tuesday" etc., resolve it to an actual YYYY-MM-DD using the current date provided below.
- If the request is unclear or you have nothing sensible to propose, return an empty actions array and explain why in "reply".
- Output nothing but the JSON object.`;

exports.runAssistant = onCall(
  { secrets: [anthropicApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in required.");
    }

    const message = request.data && request.data.message;
    if (!message || typeof message !== "string" || !message.trim()) {
      throw new HttpsError("invalid-argument", "message is required.");
    }
    const customers = Array.isArray(request.data.customers) ? request.data.customers.slice(0, 200) : [];
    const jobs = Array.isArray(request.data.jobs) ? request.data.jobs.slice(0, 100) : [];
    // Prior turns of this conversation, so the assistant actually remembers
    // what was just said instead of treating every message as the first —
    // capped and trimmed so a long chat can't blow past the context window.
    const rawHistory = Array.isArray(request.data.history) ? request.data.history.slice(-12) : [];
    const history = rawHistory
      .filter((h) => h && typeof h.role === "string" && typeof h.content === "string" && h.content.trim())
      .map((h) => ({
        role: h.role === "assistant" ? "assistant" : "user",
        content: h.content.trim().slice(0, 4000),
      }));

    const userSnap = await db.doc(`users/${request.auth.uid}`).get();
    if (!userSnap.exists) {
      throw new HttpsError("permission-denied", "No company profile found for this account.");
    }

    const today = new Date().toISOString().slice(0, 10);
    const contextBlock = `\n\nToday's date: ${today}\nExisting customers: ${JSON.stringify(
      customers
    )}\nRecent jobs: ${JSON.stringify(jobs)}`;

    let anthropicRes;
    try {
      anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": anthropicApiKey.value(),
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-5",
          max_tokens: 1500,
          system: ASSISTANT_SYSTEM_PROMPT + contextBlock,
          messages: [...history, { role: "user", content: message.trim() }],
        }),
      });
    } catch (err) {
      logger.error("Anthropic request failed to send", err);
      throw new HttpsError("unavailable", "Couldn't reach the AI service. Try again.");
    }

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      logger.error("Anthropic API error", anthropicRes.status, errBody);
      if (anthropicRes.status === 401) {
        throw new HttpsError("failed-precondition", "AI service rejected the API key — check ANTHROPIC_API_KEY.");
      }
      throw new HttpsError("internal", "AI request failed.");
    }

    const data = await anthropicRes.json();
    const textBlock = data.content && data.content.find((b) => b.type === "text");

    // Previously, a missing/empty content block silently fell through to
    // `raw = "{}"`, which parsed "successfully" into an empty {reply:"",
    // actions:[]} — a 200 response with nothing in it, which the UI then
    // had nothing to show for. Treat "no text content at all" as the real
    // failure it is instead of pretending it was a normal empty answer, and
    // log the full response so the actual cause (stop_reason, etc.) shows
    // up in `firebase functions:log` / Cloud Console the next time this
    // happens.
    if (!textBlock || !textBlock.text) {
      logger.error("Anthropic returned no text content", {
        stopReason: data.stop_reason,
        contentTypes: (data.content || []).map((b) => b.type),
        raw: data,
      });
      throw new HttpsError(
        "internal",
        `AI didn't return an answer (stop reason: ${data.stop_reason || "unknown"}). Try again — if it keeps happening, check the Cloud Functions logs.`
      );
    }
    const raw = textBlock.text;

    let parsed;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch (err) {
      logger.warn("Couldn't parse assistant response as JSON", raw);
      parsed = { reply: "I couldn't quite structure that — try rephrasing it.", actions: [] };
    }

    return {
      reply: typeof parsed.reply === "string" ? parsed.reply : "",
      actions: Array.isArray(parsed.actions) ? parsed.actions : [],
    };
  }
);

const PRICE_BOOK_SYSTEM_PROMPT = `You extract line items from an HVAC contractor's uploaded price sheet, parts catalog, or supplier list so they can be imported into a price book. Read the whole document and pull out every distinct sellable/billable item that has a clear price attached.

Respond with ONLY a JSON object (no markdown fencing, no commentary) matching exactly this shape:
{ "items": [ { "name": string, "category": "labor" | "part" | "material" | "fee", "unitPrice": number, "unit": string, "notes": string } ] }

Rules:
- "unit" is what the price is per — "each", "hour", "lb", "job", "sq ft", etc. Guess "each" if unclear.
- "category": "labor" for billed time/services, "part" for a specific component (e.g. a capacitor, a compressor), "material" for bulk/consumable supplies (e.g. refrigerant, duct tape, wire), "fee" for flat charges (e.g. dispatch fee, diagnostic fee).
- Skip section headers, page numbers, taglines, and anything without a real numeric price.
- Keep "name" short and specific — as it would appear on an estimate line, not the full catalog description.
- Cap at 300 items. If the document clearly has more, take the first 300 and note it in "notes" of the last item.
- If you can't find any priced line items at all, return { "items": [] }.
- Output nothing but the JSON object.`;

// Turns an uploaded PDF price sheet or CSV export into structured price book
// line items for the admin to review and import — never writes to Firestore
// itself. Storage rules already scope reads to the caller's own company
// bucket path, but we double-check the path prefix here too since Admin SDK
// storage access bypasses those rules entirely.
exports.parsePriceBookFile = onCall(
  { secrets: [anthropicApiKey] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Sign in required.");
    }
    const storagePath = request.data && request.data.storagePath;
    const mimeType = request.data && request.data.mimeType;
    if (!storagePath || typeof storagePath !== "string") {
      throw new HttpsError("invalid-argument", "storagePath is required.");
    }

    const userSnap = await db.doc(`users/${request.auth.uid}`).get();
    if (!userSnap.exists) {
      throw new HttpsError("permission-denied", "No company profile found for this account.");
    }
    const companyId = userSnap.data().companyId;
    if (!storagePath.startsWith(`priceBookImports/${companyId}/`)) {
      throw new HttpsError("permission-denied", "That file doesn't belong to your company.");
    }

    const isPdf = mimeType === "application/pdf" || storagePath.toLowerCase().endsWith(".pdf");
    const isCsv = mimeType === "text/csv" || storagePath.toLowerCase().endsWith(".csv");
    if (!isPdf && !isCsv) {
      throw new HttpsError(
        "invalid-argument",
        "Only PDF or CSV files are supported right now — export spreadsheets/Excel files to CSV first."
      );
    }

    let fileBuffer;
    try {
      const [contents] = await admin.storage().bucket().file(storagePath).download();
      fileBuffer = contents;
    } catch (err) {
      logger.error("Couldn't download price book import file", err);
      throw new HttpsError("internal", "Couldn't read that file. Try uploading it again.");
    }

    // Cap raw file size fed to the model — a 15MB catalog PDF is plenty for
    // a price sheet; bigger than that is almost certainly not a price list.
    if (fileBuffer.length > 15 * 1024 * 1024) {
      throw new HttpsError("invalid-argument", "That file is too large — try a smaller export (under 15MB).");
    }

    const userContent = isPdf
      ? [
          {
            type: "document",
            source: { type: "base64", media_type: "application/pdf", data: fileBuffer.toString("base64") },
          },
          { type: "text", text: "Extract the price book items from this document." },
        ]
      : [
          {
            type: "text",
            text: `Extract the price book items from this CSV file:\n\n${fileBuffer.toString("utf8").slice(0, 200000)}`,
          },
        ];

    let anthropicRes;
    try {
      anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-api-key": anthropicApiKey.value(),
          "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
          model: "claude-sonnet-5",
          max_tokens: 4000,
          system: PRICE_BOOK_SYSTEM_PROMPT,
          messages: [{ role: "user", content: userContent }],
        }),
      });
    } catch (err) {
      logger.error("Anthropic request failed to send", err);
      throw new HttpsError("unavailable", "Couldn't reach the AI service. Try again.");
    }

    if (!anthropicRes.ok) {
      const errBody = await anthropicRes.text();
      logger.error("Anthropic API error", anthropicRes.status, errBody);
      if (anthropicRes.status === 401) {
        throw new HttpsError("failed-precondition", "AI service rejected the API key — check ANTHROPIC_API_KEY.");
      }
      throw new HttpsError("internal", "AI request failed.");
    }

    const data = await anthropicRes.json();
    const raw = (data.content && data.content[0] && data.content[0].text) || "{}";

    let parsed;
    try {
      const jsonMatch = raw.match(/\{[\s\S]*\}/);
      parsed = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch (err) {
      logger.warn("Couldn't parse price book response as JSON", raw);
      parsed = { items: [] };
    }

    const items = Array.isArray(parsed.items) ? parsed.items : [];
    return {
      items: items.slice(0, 300).map((it) => ({
        name: typeof it.name === "string" ? it.name : "Untitled item",
        category: ["labor", "part", "material", "fee"].includes(it.category) ? it.category : "part",
        unitPrice: Number(it.unitPrice) || 0,
        unit: typeof it.unit === "string" && it.unit ? it.unit : "each",
        notes: typeof it.notes === "string" ? it.notes : "",
      })),
    };
  }
);

// Owner-only growth stats: total signups, a day-by-day count for the last
// 30 days, and a breakdown by self-reported trade/team size (see
// CompanySetup.jsx). Uses the Admin SDK to read across every company doc,
// which no Firestore rule allows a normal client to do — that's why this
// has to be a callable instead of a direct client query, and why it's
// locked to one specific account rather than "isCompanyAdmin" or similar.
// This never returns anything per-company beyond aggregate counts, so even
// if the email check were somehow bypassed, no other business's data leaks.
const OWNER_EMAIL = "jchoihllh@gmail.com";

exports.getGrowthStats = onCall(async (request) => {
  if (!request.auth || (request.auth.token.email || "").toLowerCase() !== OWNER_EMAIL) {
    throw new HttpsError("permission-denied", "Not available on this account.");
  }

  const companiesSnap = await db.collection("companies").get();
  const byDay = {};
  const byTrade = {};
  const byTeamSize = {};
  let total = 0;

  companiesSnap.forEach((doc) => {
    const c = doc.data();
    total += 1;
    const createdAt = c.createdAt && c.createdAt.toDate ? c.createdAt.toDate() : null;
    if (createdAt) {
      const key = createdAt.toISOString().slice(0, 10);
      byDay[key] = (byDay[key] || 0) + 1;
    }
    const trade = c.trade || "unspecified";
    byTrade[trade] = (byTrade[trade] || 0) + 1;
    const teamSize = c.teamSize || "unspecified";
    byTeamSize[teamSize] = (byTeamSize[teamSize] || 0) + 1;
  });

  let welcomeVisits = 0;
  try {
    const visitsSnap = await db.doc("siteAnalytics/welcome").get();
    welcomeVisits = visitsSnap.exists ? Number(visitsSnap.data().visits) || 0 : 0;
  } catch (err) {
    logger.warn("Couldn't read siteAnalytics/welcome", err);
  }

  return { total, byDay, byTrade, byTeamSize, welcomeVisits };
});

// Owner-only: reads back the marketplace concierge MVP submissions
// (marketplaceLeads, marketplaceContractors) so they can be matched by
// hand. Same lock-to-one-account pattern as getGrowthStats, for the same
// reason — no Firestore rule lets a normal client list these collections.
exports.getMarketplaceSubmissions = onCall(async (request) => {
  if (!request.auth || (request.auth.token.email || "").toLowerCase() !== OWNER_EMAIL) {
    throw new HttpsError("permission-denied", "Not available on this account.");
  }

  const [leadsSnap, contractorsSnap, bidsSnap] = await Promise.all([
    db.collection("marketplaceLeads").orderBy("createdAt", "desc").get(),
    db.collection("marketplaceContractors").orderBy("createdAt", "desc").get(),
    db.collection("marketplaceBids").orderBy("createdAt", "desc").get(),
  ]);

  const toPlain = (snap) =>
    snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        ...d,
        createdAt: d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().toISOString() : null,
      };
    });

  return { leads: toPlain(leadsSnap), contractors: toPlain(contractorsSnap), bids: toPlain(bidsSnap) };
});

// Public (no auth/email check — this one's meant for any contractor
// browsing open jobs to bid on, not just the owner). Deliberately returns
// only non-identifying fields (trade, area, a short description, when it
// came in) — never the homeowner's name/phone/address, so a stranger
// bidding can't harvest contact info before actually being matched. Full
// details still only ever come out through getMarketplaceSubmissions.
exports.listOpenLeads = onCall(async () => {
  const snap = await db
    .collection("marketplaceLeads")
    .where("status", "==", "new")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  return {
    leads: snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        trade: d.trade || "other",
        area: d.area || "Perth Amboy",
        description: d.description || "",
        createdAt: d.createdAt && d.createdAt.toDate ? d.createdAt.toDate().toISOString() : null,
      };
    }),
  };
});
