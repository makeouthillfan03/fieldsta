import { Link } from "react-router-dom";

// Privacy Policy. Fieldsta collects contact info (name, email, phone) from
// two distinct groups: (1) leads who submit the demo/contact form on this
// site, and (2) end-leads whose data a paying Customer feeds into the
// responder product. Both need disclosure — this page covers both.
//
// Reviewed. Update LAST_UPDATED any time this content changes.
const LAST_UPDATED = "July 2026";

export default function Privacy() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 text-sm leading-relaxed text-foreground">
      <div>
        <Link to="/" className="text-xs font-medium text-muted-foreground hover:text-foreground">
          ← Fieldsta
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Privacy Policy</h1>
        <p className="mt-1 text-xs text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </div>

      <p>
        This policy explains what Fieldsta Services LLC (&quot;Fieldsta,&quot; &quot;we,&quot; &quot;us&quot;) collects, why, and what rights
        you have. It applies both to visitors of this website and to individuals whose contact
        information a Fieldsta Customer submits to our service as part of their own lead-response
        workflow.
      </p>

      <Section title="1. What we collect">
        <p>
          <strong>From website visitors:</strong> name, email, phone number, and any message
          submitted through a form on this site, plus standard technical data (IP address,
          browser, pages visited) collected automatically by our hosting provider.
        </p>
        <p className="mt-2">
          <strong>From Customers&apos; end-leads:</strong> when a business uses Fieldsta to draft
          replies to their own inbound leads, we process the contact information and message
          content that business submits to us on that lead&apos;s behalf — typically name, email,
          phone number, and the content of their inquiry.
        </p>
      </Section>

      <Section title="2. Why we collect it">
        <p>
          To respond to inquiries submitted through this site; to provide the core service a
          Customer pays for — drafting and, once approved, sending replies to their leads; to
          improve response quality; and to meet legal and accounting obligations.
        </p>
      </Section>

      <Section title="3. Who we share it with">
        <p>
          We do not sell personal information. We share it only with service providers who help us
          operate: our email provider (Zoho Mail) to send messages, our AI provider (Anthropic) to
          draft message content, and our hosting providers (Vercel, Firebase) to run the site and
          store data. Where Fieldsta sends outbound prospecting email on a Customer&apos;s behalf, a
          third-party email-delivery platform may also process recipient contact information for
          that purpose. These providers are contractually limited to using data only to provide
          their service to us.
        </p>
      </Section>

      <Section title="4. Data retention">
        <p>
          We retain lead and message data for as long as reasonably needed to provide the service
          and meet legal obligations. A Customer may request deletion of their data or their
          leads&apos; data at any time by contacting us; we will delete it unless we&apos;re required to
          retain it by law.
        </p>
      </Section>

      <Section title="5. Your rights">
        <p>
          Depending on where you live, you may have the right to access, correct, or delete your
          personal information, to object to certain processing, or to opt out of receiving
          further communications. To exercise any of these rights, email{" "}
          <a href="mailto:support@fieldsta.com" className="underline">
            support@fieldsta.com
          </a>
          . If you received an email from a business using Fieldsta and no longer wish to be
          contacted, use the unsubscribe link in that email or reply directly to that business.
        </p>
      </Section>

      <Section title="6. Security">
        <p>
          We use reasonable technical and organizational measures to protect personal information,
          including access controls and encrypted transport (TLS) for data in transit. No system
          is perfectly secure, and we cannot guarantee absolute security.
        </p>
      </Section>

      <Section title="7. Children's privacy">
        <p>
          Fieldsta is a business-to-business service and is not directed at, or knowingly used to
          collect information from, children under 13.
        </p>
      </Section>

      <Section title="8. Changes to this policy">
        <p>
          We may update this policy as Fieldsta&apos;s product changes. Material changes will update
          the &quot;Last updated&quot; date above.
        </p>
      </Section>

      <Section title="9. Contact">
        <p>Questions about this policy, or to exercise a privacy right: support@fieldsta.com</p>
      </Section>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="space-y-1.5">
      <h2 className="font-semibold">{title}</h2>
      {children}
    </div>
  );
}
