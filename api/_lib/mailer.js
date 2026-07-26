import nodemailer from "nodemailer";

// Shared Zoho transporter — same mailbox used for owner notifications
// (api/lead.js) and now for signed-agreement records (api/sign-agreement.js).
// One place to configure so both stay in sync.
let cachedTransporter = null;
export function getTransporter() {
  if (cachedTransporter) return cachedTransporter;
  cachedTransporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp.zoho.com",
    port: Number(process.env.SMTP_PORT || 465),
    secure: true,
    auth: { user: process.env.FROM_EMAIL, pass: process.env.SMTP_PASS },
  });
  return cachedTransporter;
}

export function smtpConfigured() {
  return Boolean(process.env.SMTP_PASS && process.env.FROM_EMAIL);
}
