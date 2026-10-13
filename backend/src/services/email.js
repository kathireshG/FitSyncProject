const nodemailer = require("nodemailer");

function createTransporter() {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) return null;

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || "smtp-mail.outlook.com",
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === "true",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

async function sendPasswordResetEmail({ to, resetUrl }) {
  const transporter = createTransporter();
  if (!transporter) return false;

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: "Reset your FitSync password",
    text: `Reset your FitSync password using this link: ${resetUrl}\n\nThis link expires shortly and can only be used once.`,
    html: `<p>Reset your FitSync password using the link below.</p><p><a href="${resetUrl}">Reset password</a></p><p>This link expires shortly and can only be used once.</p>`,
  });
  return true;
}

async function sendContactEmail({ name, email, message }) {
  const transporter = createTransporter();
  if (!transporter) return false;
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to: process.env.CONTACT_EMAIL || process.env.SMTP_USER,
    replyTo: email,
    subject: "New FitSync contact message",
    text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
  });
  return true;
}

module.exports = { sendPasswordResetEmail, sendContactEmail };
