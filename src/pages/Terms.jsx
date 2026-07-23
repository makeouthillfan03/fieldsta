import { Link } from "react-router-dom";

// Terms & Conditions — see chat: "there needs to be a terms and conditions
// because the insurance company says because they dont know the prices of
// every different thing, and the driver needs insurance as well, that our
// company fieldsta isnt responsible for anything given that we dont have
// insurance, make it clear in the start before signing up" and "make it
// bullet proof so we are protected from all possible legalities."
//
// IMPORTANT — this is drafted in standard protective language, not
// reviewed by a licensed attorney. No Terms page makes a business immune
// to legal risk on its own; two things matter more than wording: (1)
// whether Fieldsta is an actual formed LLC (separates company liability
// from jc's personal assets — if not done yet, this matters more than
// anything on this page), and (2) whether NJ's Consumer Fraud Act or
// Contractors' Registration Act limits what a platform connecting
// homeowners to home-improvement work can disclaim — some states don't
// let a liability waiver override consumer-protection law no matter how
// it's worded. A NJ attorney should review this before it's relied on for
// real. Update the "Last updated" date any time this content changes.
const LAST_UPDATED = "July 2026";

export default function Terms() {
  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-8 text-sm leading-relaxed text-foreground">
      <div>
        <Link to="/find-a-pro" className="text-xs font-medium text-muted-foreground hover:text-foreground">
          ← Fieldsta
        </Link>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Terms &amp; Conditions</h1>
        <p className="mt-1 text-xs text-muted-foreground">Last updated: {LAST_UPDATED}</p>
      </div>

      <p>
        Fieldsta ("Fieldsta," "we," "us") operates a free local job board connecting homeowners
        who need work done ("Homeowners") with independent contractors and service providers
        ("Contractors") in the Perth Amboy, NJ area. By posting a job, submitting a bid, creating
        an account, or otherwise using Fieldsta, you agree to these Terms. If you don't agree,
        don't use Fieldsta.
      </p>

      <Section title="1. Fieldsta is a referral platform, not a party to any job">
        <p>
          Fieldsta only connects Homeowners and Contractors. We are not a contractor, general
          contractor, subcontractor, employer, agent, or insurer of anyone who uses this site.
          Fieldsta does not perform home improvement work, is not engaged in the business of
          making or selling home improvements, does not set or collect payment for any job, and
          does not draft, review, or become a party to the contract for any job. Any agreement for
          work — including price, scope, timeline, materials, and payment — is made directly and
          solely between the Homeowner and the Contractor. Fieldsta is not a party to that
          agreement and has no obligation to enforce it.
        </p>
      </Section>

      <Section title="2. No insurance, no liability for the work performed">
        <p>
          Fieldsta does not carry, and is not covered by, any insurance policy for the work
          performed by Contractors found through this site. Fieldsta is not responsible or liable,
          under any theory of law, for: the price, quality, timeliness, or workmanship of any job;
          any property damage; any personal injury, illness, or death; any dispute between a
          Homeowner and a Contractor; or any loss of any kind arising from or related to work
          arranged through Fieldsta. This applies whether the claim is based on contract, tort,
          negligence, strict liability, or any other legal theory, to the maximum extent permitted
          by law and subject to Section 4 below.
        </p>
      </Section>

      <Section title="3. Contractors are independent and solely responsible for their own insurance and licensing">
        <p>
          Contractors are independent businesses, not employees, agents, or representatives of
          Fieldsta. Each Contractor is solely responsible for maintaining their own liability
          insurance, workers' compensation coverage (if applicable), vehicle insurance, and any
          license or registration required by New Jersey law for their trade — including, where
          applicable, registration under New Jersey's Contractors' Registration Act before
          soliciting or performing any home improvement work valued at $500 or more. Any license or
          registration number a Contractor provides on Fieldsta is self-reported and has not been
          independently verified by Fieldsta. Fieldsta does not guarantee that any Contractor is
          licensed, registered, insured, or bonded. Homeowners are responsible for independently
          confirming a Contractor's licensing and insurance — for example through the NJ Division
          of Consumer Affairs — before hiring them. New Jersey law also requires that any home
          improvement contract worth $500 or more be in writing and signed by both parties;
          Homeowners and Contractors are solely responsible for putting their agreement in writing
          before work begins.
        </p>
      </Section>

      <Section title="4. Consumer protection rights are not waived">
        <p>
          Nothing in these Terms waives, limits, or attempts to waive or limit any right or remedy
          that cannot lawfully be waived or limited under applicable law, including the New Jersey
          Consumer Fraud Act (N.J.S.A. 56:8-1 et seq.) or the New Jersey Truth-in-Consumer
          Contract, Warranty and Notice Act. If any provision of these Terms is read to do so, that
          provision applies only to the maximum extent permitted by law, and no further.
        </p>
      </Section>

      <Section title="5. Homeowners are responsible for vetting and negotiating directly">
        <p>
          Fieldsta does not set prices, does not guarantee any estimate, and does not warrant the
          accuracy of anything a Contractor or Homeowner posts. Homeowners are responsible for
          negotiating price and scope directly with a Contractor, checking references, and using
          their own judgment before allowing anyone into their home or authorizing any work.
        </p>
      </Section>

      <Section title="6. No warranties">
        <p>
          Fieldsta is provided "as is" and "as available," without warranties of any kind, express
          or implied, including any warranty of merchantability, fitness for a particular purpose,
          or non-infringement. We don't warrant that the site will be uninterrupted, error-free,
          or secure, or that any match will result in a completed job.
        </p>
      </Section>

      <Section title="7. Limitation of liability">
        <p>
          To the maximum extent permitted by law, Fieldsta's total liability to you for any claim
          arising from your use of the site is limited to $0, since Fieldsta does not charge
          Homeowners or Contractors for use of the site at this time. In no event will Fieldsta be
          liable for indirect, incidental, special, consequential, or punitive damages. This
          section is subject to Section 4 above.
        </p>
      </Section>

      <Section title="8. Indemnification">
        <p>
          You agree to indemnify, defend, and hold harmless Fieldsta and its founder from any
          claim, damage, loss, or expense (including reasonable attorney's fees) arising out of or
          related to: your use of the site; work performed or requested through the site; your
          violation of these Terms; or your violation of any law or the rights of a third party.
          This does not apply to the extent a claim results from Fieldsta's own violation of law.
        </p>
      </Section>

      <Section title="9. No employment or agency relationship">
        <p>
          Nothing on Fieldsta creates an employment, partnership, joint venture, or agency
          relationship between Fieldsta and any Homeowner or Contractor.
        </p>
      </Section>

      <Section title="10. Eligibility and conduct">
        <p>
          You must be at least 18 years old to use Fieldsta. You agree to provide accurate contact
          information and not to use the site for any unlawful purpose, to harass anyone, or to
          misrepresent your identity, licensing, or qualifications.
        </p>
      </Section>

      <Section title="11. Assumption of risk">
        <p>
          You understand that hiring someone to perform work in or around your home involves
          inherent risk, and that allowing an unfamiliar person onto your property is a decision
          you make at your own discretion. You assume that risk when you choose to use Fieldsta to
          find or accept work.
        </p>
      </Section>

      <Section title="12. No guarantee of a match, and right to remove users">
        <p>
          Fieldsta does not guarantee that any Homeowner will be matched with a Contractor, that
          any Contractor will respond, or that any job posted will result in completed work.
          Fieldsta may remove, suspend, or decline to feature any listing, bid, or account, for
          any reason or no reason, including if we believe it's fraudulent, unsafe, or violates
          these Terms.
        </p>
      </Section>

      <Section title="13. Not professional advice">
        <p>
          Nothing on Fieldsta is legal, financial, insurance, or professional trade advice. Pricing
          shown or estimated anywhere on the site (if any) is informational only, not a quote from
          Fieldsta, and not a substitute for a written estimate from the Contractor you hire.
        </p>
      </Section>

      <Section title="14. Force majeure">
        <p>
          Fieldsta is not liable for any failure or delay in the site's operation caused by events
          outside our reasonable control, including outages, natural disasters, or third-party
          service failures (for example, our hosting, email, or map providers).
        </p>
      </Section>

      <Section title="15. No third-party beneficiaries; entire agreement; no waiver">
        <p>
          These Terms are between you and Fieldsta only and create no rights for anyone else.
          These Terms are the entire agreement between you and Fieldsta regarding your use of the
          site and supersede any prior agreement on the subject. Fieldsta's failure to enforce any
          part of these Terms is not a waiver of the right to enforce it later.
        </p>
      </Section>

      <Section title="16. Changes to these Terms">
        <p>
          We may update these Terms as Fieldsta grows (for example, if we later add paid
          transactions or automated matching). Continued use of the site after a change means you
          accept the updated Terms. Material changes will update the "Last updated" date above.
        </p>
      </Section>

      <Section title="17. Governing law and disputes">
        <p>
          These Terms are governed by the laws of the State of New Jersey, without regard to
          conflict-of-law principles. Any dispute arising from these Terms or your use of Fieldsta
          will be resolved through binding individual arbitration rather than in court, except
          that either party may bring an individual claim in small claims court. You agree to
          resolve disputes on an individual basis only, and waive any right to bring or
          participate in a class action, to the extent that waiver is enforceable under applicable
          law (see Section 4).
        </p>
      </Section>

      <Section title="18. Severability">
        <p>
          If any part of these Terms is found unenforceable, the rest remain in full effect, and
          the unenforceable part will be interpreted to reflect the original intent as closely as
          permitted by law.
        </p>
      </Section>

      <Section title="19. Contact">
        <p>Questions about these Terms: support@fieldsta.com</p>
      </Section>

      <p className="text-xs text-muted-foreground">
        This page is a general template and has not been reviewed by an attorney licensed in New
        Jersey. It is provided for informational purposes as part of setting up Fieldsta and should
        not be relied on as legal advice.
      </p>
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
