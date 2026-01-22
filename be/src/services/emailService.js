import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// 1. Configure Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  // If port is 465 (Gmail), secure is true. If 587 (Brevo), secure is false.
  secure: Number(process.env.SMTP_PORT) === 465, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Helper to send the actual email
const sendEmail = async (to, subject, html) => {
  const mailOptions = {
    from: `"Weave App" <${process.env.EMAIL_FROM}>`,
    to,
    subject,
    html,
  };
  return transporter.sendMail(mailOptions);
};

// ============================================================
// EXPORT 1: EMAIL DE VÉRIFICATION (INSCRIPTION)
// ============================================================
export const sendVerificationEmail = async (to, code) => {
  const subject = 'Activez votre compte Weave';
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
  
  // Creates: http://localhost:5173/verify-email?code=123&email=abc@test.com
  const magicLink = `${baseUrl}/verify-email?code=${code}&email=${encodeURIComponent(to)}`;

  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px;">
      <h2>Bienvenue !</h2>
      <p>Cliquez ci-dessous pour valider votre compte :</p>
      <a href="${magicLink}" style="background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
        Vérifier mon email
      </a>
      <p>Ou entrez ce code : <strong>${code}</strong></p>
    </div>
  `;

  try {
    await sendEmail(to, subject, html);
    console.log(`📧 SENT VERIFY LINK: ${magicLink}`);
  } catch (e) {
    console.error("Email Error:", e);
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