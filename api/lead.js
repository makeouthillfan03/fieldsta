// Lead intake endpoint — Eleven X style qualification form.
// Pushes new leads into Apollo as contacts automatically.
// Requires APOLLO_API_KEY set as a Vercel environment variable (Production scope).
//
// Also forwards the lead to the Fieldsta responder agent (fieldsta-agents,
// `npm run serve`) which qualifies it and drafts a reply for human review,
// notifying via Slack rather than email. Set RESPONDER_WEBHOOK_URL to
// enable. Capturing the lead is the job that must never fail, so the
// forward is fire-and-forget: if the responder is down, unreachable, or
// slow, this endpoint still returns success and the lead still reaches
// Apollo.

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

    await forwardToResponder(leadForForwarding);

    return res.status(200).json({
      message: 'Demo request received — our team will follow up soon.',
    });
  } catch (err) {
    console.error('Lead handler error:', err);
    return res.status(500).json({ message: 'Something went wrong on our end.' });
  }
}
