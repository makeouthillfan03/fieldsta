import { Link } from "react-router-dom";

// Terms of Service for Fieldsta's actual product: an AI service that drafts
// replies to a client's inbound leads for human approval, and (once cold
// outbound is live) sends prospecting email on the client's behalf.
//
// IMPORTANT — drafted in standard SaaS-agreement language, not reviewed by
// a licensed attorney. Two things matter more than the wording: (1) whether
// Fieldsta is an actual formed LLC — separates company liability from jc's
// personal assets, and matters more than anything on this page if it hasn't
// happened yet; (2) an attorney should confirm the liability cap and
// indemnification sections hold up given Fieldsta drafts messages sent
// under a client's name to that client's own customers/prospects. Update
// LAST_UPDATED any time this content changes.
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
        Fieldsta ("Fieldsta," "we," "us") provides an AI-assisted service that drafts replies to
        a business's inbound leads and, where enabled, drafts outbound prospecting messages, for
        review and approval by that business ("Customer," "you"). By signing up for, configuring,
        or using Fieldsta, you agree to these Terms on behalf of yourself and the business you
        represent. If you don't agree, don't use Fieldsta.
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
          Where Fieldsta is used to send unsolicited commercial email ("cold outbound"), the
          Customer is responsible for ensuring their own use complies with CAN-SPAM, CASL, GDPR,
          and any other applicable law in the jurisdictions they contact, including maintaining a
          working opt-out mechanism and accurate sender information. Fieldsta is not responsible
          for a Customer's decision to contact a particular recipient or list. Fieldsta reserves
          the right to suspend outbound sending for any account that generates spam complaints,
          abuse reports, or deliverability problems at a rate we determine puts our sending
          infrastructure at risk.
        </p>
      </Section>

      <Section title="4. Data provided by the Customer">
        <p>
          The Customer may provide Fieldsta with lead data, contact information, and business
          details belonging to the Customer or the Customer's own end clients. The Customer
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
          Fieldsta is provided "as is" and "as available," without warranties of any kind, express
          or implied, including any warranty of merchantability, fitness for a particular purpose,
          or non-infringement. We don't warrant that any draft will be accurate, that any lead will
          respond, that any message will be delivered, or that the service will be uninterrupted
          or error-free.
        </p>
      </Section>

      <Section title="6. Limitation of liability">
        <p>
          To the maximum extent permitted by law, Fieldsta's total liability to a Customer for any
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
          damage, loss, or expense (including reasonable attorney's fees) arising out of or related
          to: content the Customer approved and sent through Fieldsta; the Customer's violation of
          applicable law, including anti-spam or data-privacy law; or the Customer's violation of
          these Terms. This does not apply to the extent a claim results from Fieldsta's own
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
          We may update these Terms as Fieldsta's product changes. Continued use of the service
          after a change means you accept the updated Terms. Material changes will update the
          "Last updated" date above.
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
