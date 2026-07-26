// Captures a customer's signature on the Fieldsta Customer Agreement.
// "Signature" here is a typed full legal name plus an explicit checkbox
// consent — valid as an e-signature under the U.S. ESIGN Act (15 U.S.C.
// § 7001), same mechanism DocuSign/HelloSign ultimately reduce to. No
// canvas drawing: a drawn squiggle isn't more legally binding than a typed
// name attached to clear consent language, and typed name is what's
// actually searchable in an inbox later.
//
// The record of what was signed — company, signer, plan, IP, timestamp —
// is emailed to jc as the durable copy ("so I can store it"). A copy also
// goes to the signer, standard practice for any signed agreement so both
// sides have a receipt of exactly what was agreed to.

import { getTransporter, smtpConfigured } from "./_lib/mailer.js";

const PLAN_LABELS = {
  starter: "Starter — $500/mo",
  growth: "Growth — $1,500/mo",
  pro: "Pro — $3,000/mo",
  custom: "Custom (pricing agreed separately)",
};

function clientIp(req) {
  const fwd = req.headers["x-forwarded-for"];
  if (typeof fwd === "string") return fwd.split(",")[0].trim();
  return req.socket?.remoteAddress || "unknown";
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const { companyName, signerName, signerTitle, signerEmail, plan, agreed } = req.body || {};

  if (!companyName || !signerName || !signerTitle || !signerEmail || !plan) {
    return res.status(400).json({ message: "All fields are required." });
  }
  if (!agreed) {
    return res.status(400).json({ message: "You must check the agreement box to sign." });
  }

  const signedAt = new Date();
  const record = {
    companyName,
    signerName,
    signerTitle,
    signerEmail,
    plan: PLAN_LABELS[plan] || plan,
    signedAt: signedAt.toISOString(),
    ip: clientIp(req),
  };

  if (!smtpConfigured()) {
    // Same contract as api/lead.js: never block the signer on our mailbox
    // being configured, but this endpoint's entire job is the durable
    // record, so make the gap loud in logs rather than silent.
    console.error("sign-agreement: SMTP not configured — signature NOT recorded by email:", record);
    return res.status(200).json({
      recorded: false,
      message: "Signed, but no email record was sent — SMTP isn't configured yet. Contact support@fieldsta.com to confirm.",
    });
  }

  const summaryLines = [
    `Company: ${record.companyName}`,
    `Signer: ${record.signerName} (${record.signerTitle})`,
    `Signer email: ${record.signerEmail}`,
    `Plan: ${record.plan}`,
    `Signed at: ${record.signedAt}`,
    `IP address: ${record.ip}`,
  ];

  const transporter = getTransporter();

  try {
    // The durable copy — this is the one that matters for storage.
    await transporter.sendMail({
      from: `Fieldsta <${process.env.FROM_EMAIL}>`,
      to: process.env.NOTIFY_EMAIL || process.env.FROM_EMAIL,
      subject: `Signed: Fieldsta Customer Agreement — ${record.companyName}`,
      text: [
        "A customer signed the Fieldsta Customer Agreement.",
        "",
        ...summaryLines,
        "",
        "This is the legal record of consent — keep this email.",
      ].join("\n"),
    });
  } catch (err) {
    console.error("sign-agreement: failed to send owner record:", err.message, record);
    return res.status(500).json({ message: "Something went wrong recording your signature. Please try again or email support@fieldsta.com." });
  }

  // Best-effort receipt to the signer. If this leg fails the agreement is
  // still validly signed and recorded above, so it must not fail the request.
  try {
    await transporter.sendMail({
      from: `Fieldsta <${process.env.FROM_EMAIL}>`,
      to: record.signerEmail,
      subject: "Your signed Fieldsta Customer Agreement",
      text: [
        `Hi ${record.signerName},`,
        "",
        "This confirms you signed the Fieldsta Customer Agreement on behalf of " +
          `${record.companyName}. For your records:`,
        "",
        ...summaryLines,
        "",
        "Questions: support@fieldsta.com",
      ].join("\n"),
    });
  } catch (err) {
    console.error("sign-agreement: signer receipt failed (agreement still recorded):", err.message);
  }

  return res.status(200).json({ recorded: true, message: "Signed. A copy has been sent to your email." });
}
