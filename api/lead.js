// Lead intake endpoint — Eleven X style qualification form.
// Pushes new leads into Apollo as contacts automatically.
// Requires APOLLO_API_KEY set as a Vercel environment variable (Production scope).
//
// Optionally also forwards the lead to the Fieldsta responder agent
// (fieldsta-agents, `npm run serve`) which qualifies it and drafts a reply
// for human review. Set RESPONDER_WEBHOOK_URL to enable. Capturing the
// lead is the job that must never fail, so the forward is fire-and-forget:
// if the responder is down, unreachable, or slow, this endpoint still
// returns success and the lead still reaches Apollo.

import { getTransporter, smtpConfigured } from "./_lib/mailer.js";

// Notifying jc is nice-to-have, not the job this endpoint exists to do —
// same fire-and-forget contract as forwardToResponder below. A down SMTP
// mailbox must never fail a form submission. Vercel env: SMTP_HOST,
// SMTP_PORT, FROM_EMAIL, SMTP_PASS, NOTIFY_EMAIL (where the alert goes —
// defaults to FROM_EMAIL itself).
// Returns whether the notification actually sent — the caller uses this to
// report real status back in the response, since this endpoint has no other
// way to see whether the send silently failed (fire-and-forget by design,
// but "fire-and-forget" shouldn't also mean "un-diagnosable").
async function notifyOwner(lead) {
  if (!smtpConfigured()) return { sent: false, reason: "SMTP not configured" };

  try {
    await getTransporter().sendMail({
      from: `Fieldsta <${process.env.FROM_EMAIL}>`,
      to: process.env.NOTIFY_EMAIL || process.env.FROM_EMAIL,
      subject: `New demo request — ${lead.firstName} ${lead.lastName || ""}`.trim(),
      text: [
        `Name: ${lead.firstName} ${lead.lastName || ""}`,
        `Email: ${lead.email}`,
        lead.phone ? `Phone: ${lead.phone}` : null,
        lead.company ? `Company: ${lead.company}` : null,
        lead.source ? `Source: ${lead.source}` : null,
        "",
        lead.message ? `Message:\n${lead.message}` : "(no message)",
      ]
        .filter(Boolean)
        .join("\n"),
    });
    return { sent: true };
  } catch (err) {
    console.error("Owner notification failed (lead still captured):", err.message);
    return { sent: false, reason: err.message };
  }
}

async function forwardToResponder(lead) {
  const url = process.env.RESPONDER_WEBHOOK_URL;
  if (!url) return;

  try {
    // Don't let a hung responder hold the form submission open.
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(lead),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      console.error('Responder forward returned', res.status);
    }
  } catch (err) {
    console.error('Responder forward failed (lead still captured):', err.message);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { firstName, lastName, email, crm, source, company, phone, message } = req.body || {};

  if (!firstName || !email) {
    return res.status(400).json({ message: 'First name and email are required.' });
  }

  try {
    const apolloKey = process.env.APOLLO_API_KEY;

    if (apolloKey) {
      const apolloRes = await fetch('https://api.apollo.io/api/v1/contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Api-Key': apolloKey,
        },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName || '',
          email: email,
          label_names: ['Fieldsta Website Lead'],
        }),
      });

      if (!apolloRes.ok) {
        const errText = await apolloRes.text();
        console.error('Apollo push failed:', errText);
      } else {
        console.log('Lead pushed to Apollo:', email, 'CRM:', crm, 'Source:', source);
      }
    } else {
      console.warn('APOLLO_API_KEY not set — skipping Apollo push. Lead logged only:', { firstName, lastName, email, crm, source });
    }

    const leadForForwarding = {
      firstName,
      lastName,
      email,
      company,
      phone,
      // The form has no free-text field yet, so pass the CRM answer through
      // as context — it's the only thing the lead actually tells us beyond
      // their contact details.
      message: message || (crm ? `CRM in use: ${crm}` : undefined),
      source: source || 'Website form',
    };

    const [, notifyResult] = await Promise.all([
      forwardToResponder(leadForForwarding),
      notifyOwner(leadForForwarding),
    ]);

    return res.status(200).json({
      message: 'Demo request received — our team will follow up soon.',
      ownerNotified: notifyResult.sent,
    });
  } catch (err) {
    console.error('Lead handler error:', err);
    return res.status(500).json({ message: 'Something went wrong on our end.' });
  }
}
