import nodemailer from "nodemailer";

function getClientUrl() {
  return (process.env.CLIENT_URL || "http://localhost:5173").replace(/\/$/, "");
}

function createTransporter() {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASSWORD) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
}

async function sendAuthEmail({ to, subject, text, html, previewUrl }) {
  const transporter = createTransporter();
  if (!transporter) {
    console.log(`[email preview] ${to}: ${previewUrl}`);
    return;
  }

  await transporter.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to,
    subject,
    text,
    html
  });
}

export function sendVerificationEmail(user, token) {
  const url = `${getClientUrl()}/verify-email?token=${encodeURIComponent(token)}`;
  return sendAuthEmail({
    to: user.email,
    subject: "Verify your LocalHire email",
    text: `Hi ${user.name}, verify your LocalHire email here: ${url}`,
    html: `<p>Hi ${user.name},</p><p>Verify your LocalHire email to activate your account:</p><p><a href="${url}">Verify email</a></p>`,
    previewUrl: url
  });
}

export function sendPasswordResetEmail(user, token) {
  const url = `${getClientUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  return sendAuthEmail({
    to: user.email,
    subject: "Reset your LocalHire password",
    text: `Hi ${user.name}, reset your LocalHire password here: ${url}`,
    html: `<p>Hi ${user.name},</p><p>Reset your LocalHire password:</p><p><a href="${url}">Reset password</a></p>`,
    previewUrl: url
  });
}
