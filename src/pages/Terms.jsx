import { Link } from "react-router-dom";

// Terms of Service for Fieldsta's actual product: an AI service that drafts
// replies to a client's inbound leads for human approval, and (once cold
// outbound is live) sends prospecting email on the client's behalf.
//
// Reviewed. Update LAST_UPDATED any time this content changes.
const LAST_UPDATED = "July 2026";

export default function Terms() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 text-sm leading-relaxed text-foreground">
      <div>
        <Link to="/" className="text-xs font-medium text-muted-foreground hover:text-foreground">
          ← Fieldsta
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Terms of Service</h1>
        <p className="mt-1 text-xs text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </div>

      <p>
        Fieldsta (&quot;Fieldsta,&quot; &quot;we,&quot; &quot;us&quot;) provides an AI-assisted service that drafts replies to
        a business&apos;s inbound leads and, where enabled, drafts outbound prospecting messages, for
        review and approval by that business (&quot;Customer,&quot; &quot;you&quot;). By signing up for, configuring,
        or using Fieldsta, you agree to these Terms on behalf of yourself and the business you
        represent. If you don&apos;t agree, don&apos;t use Fieldsta.
      </p>

      <Section title="1. What Fieldsta does">
        <p>
          Fieldsta drafts email replies and messages based on information the Customer provides
          about their business, services, and qualification criteria. Every message Fieldsta
          drafts requires human review and approval before it is sent, unless the Customer has
          separately configured and explicitly enabled automatic sending for a specific use case.
          Fieldsta is a drafting and workflow tool — the Customer is responsible for reviewing
          content before it goes out under their name.
        </p>
      </Section>

      <Section title="2. Customer is responsible for the accuracy of what's sent">
        <p>
          The Customer is solely responsible for reviewing, editing, and approving any message
          before it is sent, and for ensuring that anything sent — whether drafted by Fieldsta or
          edited by the Customer — is accurate, compliant with applicable law, and consistent with
          any representations the Customer is authorized to make about their own business,
          pricing, licensing, or services. Fieldsta does not verify the factual accuracy of
          Customer-provided information used to generate drafts.
        </p>
      </Section>

      <Section title="3. Compliance with anti-spam and communications law">
        <p>
          Where Fieldsta is used to send unsolicited commercial email (&quot;cold outbound&quot;), the
          Customer is responsible for ensuring their own use complies with CAN-SPAM, CASL, GDPR,
          and any other applicable law in the jurisdictions they contact, including maintaining a
          working opt-out mechanism and accurate sender information. Fieldsta is not responsible
          for a Customer&apos;s decision to contact a particular recipient or list. Fieldsta reserves
          the right to suspend outbound sending for any account that generates spam complaints,
          abuse reports, or deliverability problems at a rate we determine puts our sending
          infrastructure at risk.
        </p>
      </Section>

      <Section title="4. Data provided by the Customer">
        <p>
          The Customer may provide Fieldsta with lead data, contact information, and business
          details belonging to the Customer or the Customer&apos;s own end clients. The Customer
          represents that they have the right to share this data with Fieldsta and to have
          Fieldsta process it for the purpose of drafting and sending communications. See our{" "}
          <Link to="/privacy" className="underline">
            Privacy Policy
          </Link>{" "}
          for how Fieldsta handles this data.
        </p>
      </Section>

      <Section title="5. No warranties">
        <p>
          Fieldsta is provided &quot;as is&quot; and &quot;as available,&quot; without warranties of any kind, express
          or implied, including any warranty of merchantability, fitness for a particular purpose,
          or non-infringement. We don&apos;t warrant that any draft will be accurate, that any lead will
          respond, that any message will be delivered, or that the service will be uninterrupted
          or error-free.
        </p>
      </Section>

      <Section title="6. Limitation of liability">
        <p>
          To the maximum extent permitted by law, Fieldsta&apos;s total liability to a Customer for any
          claim arising from use of the service is limited to the amount the Customer paid
          Fieldsta in the three months preceding the claim. In no event will Fieldsta be liable for
          indirect, incidental, special, consequential, or punitive damages, including lost
          revenue or lost business opportunities arising from a delayed, inaccurate, or unsent
          message.
        </p>
      </Section>

      <Section title="7. Indemnification">
        <p>
          The Customer agrees to indemnify, defend, and hold harmless Fieldsta from any claim,
          damage, loss, or expense (including reasonable attorney&apos;s fees) arising out of or related
          to: content the Customer approved and sent through Fieldsta; the Customer&apos;s violation of
          applicable law, including anti-spam or data-privacy law; or the Customer&apos;s violation of
          these Terms. This does not apply to the extent a claim results from Fieldsta&apos;s own
          violation of law.
        </p>
      </Section>

      <Section title="8. Termination">
        <p>
          Either party may terminate the service relationship at any time. Fieldsta may suspend or
          terminate an account immediately if we believe it is being used unlawfully, to send
          abusive or fraudulent content, or in a way that threatens our sending infrastructure or
          other customers.
        </p>
      </Section>

      <Section title="9. Changes to these Terms">
        <p>
          We may update these Terms as Fieldsta&apos;s product changes. Continued use of the service
          after a change means you accept the updated Terms. Material changes will update the
          &quot;Last updated&quot; date above.
        </p>
      </Section>

      <Section title="10. Governing law and disputes">
        <p>
          These Terms are governed by the laws of the State of New Jersey, without regard to
          conflict-of-law principles. Any dispute arising from these Terms or your use of Fieldsta
          will be resolved through binding individual arbitration rather than in court, except
          that either party may bring an individual claim in small claims court. You agree to
          resolve disputes on an individual basis only, and waive any right to bring or
          participate in a class action, to the extent that waiver is enforceable under applicable
          law.
        </p>
      </Section>

      <Section title="11. Severability">
        <p>
          If any part of these Terms is found unenforceable, the rest remain in full effect, and
          the unenforceable part will be interpreted to reflect the original intent as closely as
          permitted by law.
        </p>
      </Section>

      <Section title="12. Contact">
        <p>Questions about these Terms: support@fieldsta.com</p>
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
