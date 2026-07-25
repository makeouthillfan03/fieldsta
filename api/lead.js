// Lead intake endpoint — Eleven X style qualification form.
// Pushes new leads into Apollo as contacts automatically.
// Requires APOLLO_API_KEY set as a Vercel environment variable (Production scope).

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { firstName, lastName, email, crm, source } = req.body || {};

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

    return res.status(200).json({ message: 'Demo request received — our team will follow up soon.' });
  } catch (err) {
    console.error('Lead handler error:', err);
    return res.status(500).json({ message: 'Something went wrong on our end.' });
  }
}
