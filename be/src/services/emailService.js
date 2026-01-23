import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// 1. Configure Transporter
let transporter;
if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    // If port is 465 (Gmail), secure is true. If 587 (Brevo), secure is false.
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  // Verify transporter connectivity at startup to surface config issues early
  transporter.verify()
    .then(() => console.log('✅ SMTP transporter verified and ready.'))
    .catch((err) => console.warn('⚠️ SMTP transporter verification failed:', err.message));
} else {
  // Development fallback: avoid attempting to connect to localhost:587 when no SMTP is configured.
  // Use JSON transport so emails are emitted as objects and logged instead of throwing ECONNREFUSED.
  transporter = nodemailer.createTransport({ jsonTransport: true });
  console.warn('⚠️  SMTP_HOST not set — using jsonTransport fallback (emails will be logged, not sent).');
}

// Helper to send the actual email
const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: `"Weave App" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  };
  try {
    const info = await transporter.sendMail(mailOptions);
    // Log useful info for debugging; nodemailer returns different shapes depending on transport
    console.log(`📧 Email sent to ${to}. transportInfo:`, info && info.messageId ? info.messageId : info);
    return info;
  } catch (err) {
    console.error('Email Error sending to', to, err);
    throw err;
  }
};

// ============================================================
// EXPORT 1: EMAIL DE VÉRIFICATION (INSCRIPTION)
// ============================================================
export const sendVerificationEmail = async (to, code) => {
  const subject = 'Code de vérification Weave';

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Bienvenue sur Weave</h2>
      <p>Voici votre code de vérification à 6 chiffres :</p>
      <div style="font-size: 28px; font-weight: bold; background:#f3f4f6; padding: 12px 16px; display:inline-block; border-radius:6px;">${code}</div>
      <p style="margin-top:16px; color:#6b7280;">Saisissez ce code dans l'application pour activer votre compte. Le code expire sous 24 heures.</p>
    </div>
  `;

  try {
    await sendEmail(to, subject, html);
    console.log(`📧 Sent verification code to: ${to}`);
  } catch (e) {
    console.error("Email Error:", e);
    throw e;
  }
};

// ============================================================
// EXPORT 2: MOT DE PASSE OUBLIÉ
// ============================================================
export const sendPasswordResetEmail = async (to, token) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const link = `${baseUrl}/reset-password?token=${token}`;
  const subject = 'Réinitialisation de mot de passe';
  
  const html = `
    <div style="font-family: sans-serif; padding: 20px;">
      <h3>Mot de passe oublié ?</h3>
      <p>Cliquez ci-dessous pour le réinitialiser :</p>
      <a href="${link}" style="display:inline-block; background:#2563eb; color:white; padding:10px 20px; text-decoration:none; border-radius:4px;">Réinitialiser</a>
    </div>
  `;

  try {
    await sendEmail(to, subject, html);
  } catch (e) {
    console.error("Reset Email Error:", e);
  }
};

// ============================================================
// EXPORT 3: INVITATION AU CERCLE (POUR L'ADMIN)
// ============================================================
export const sendInvitationEmail = async (to, inviterName, seniorName, circleCode) => {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  const link = `${baseUrl}/join?code=${circleCode}`;
  
  const subject = `${inviterName} vous invite dans le cercle de soins de ${seniorName}`;

  const html = `
    <div style="font-family: Helvetica, Arial, sans-serif; padding: 40px 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border: 1px solid #e5e7eb;">
        <h2 style="color: #111827;">Invitation Weave</h2>
        <p style="font-size: 18px;">
          <strong>${inviterName}</strong> vous invite à rejoindre l'équipe de soins pour <strong>${seniorName}</strong>.
        </p>
        <div style="background-color: #eff6ff; padding: 20px; text-align: center; margin: 30px 0;">
          <p style="font-weight: bold;">CODE D'ACCÈS</p>
          <p style="font-size: 32px; font-weight: bold; color: #2563eb;">${circleCode}</p>
        </div>
        <div style="text-align: center;">
          <a href="${link}" style="background-color: #2563eb; color: #ffffff; padding: 18px 32px; text-decoration: none; border-radius: 6px;">
            Rejoindre le Cercle
          </a>
        </div>
      </div>
    </div>
  `;

  try {
    await sendEmail(to, subject, html);
  } catch (e) {
    console.error(`❌ Failed to invite ${to}:`, e.message);
    throw e;
  }
};