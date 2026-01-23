// Run this with: node test-brevo.js
import nodemailer from 'nodemailer';

// 👇 PASTE YOUR CREDENTIALS DIRECTLY HERE (No .env)
const SMTP_USER = 'a0972b001@smtp-brevo.com'; // Your Brevo Login Email
const SMTP_PASS = 'xsmtpsib-d072753c8b13e561f78f0c54e02a50d17dc7aef6b2c42e34530547f0bdf4afc9-ze9E5YyykzjZwev2';   // Your Long API Key
const SENDER_EMAIL = 'weave.entreprise@gmail.com'; // Must be a verified email in Brevo

async function testBrevo() {
  console.log("⏳ Testing Brevo connection...");

  const transporter = nodemailer.createTransport({
    host: 'smtp-relay.brevo.com',
    port: 587,
    secure: false, // false for port 587
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });

  try {
    // 1. Verify Connection
    await transporter.verify();
    console.log("✅ Connection Successful! Credentials are correct.");

    // 2. Send Test Email
    const info = await transporter.sendMail({
      from: SENDER_EMAIL,
      to: SMTP_USER, // Send to yourself
      subject: 'Test Brevo Works',
      text: 'If you receive this, the credentials are good!',
    });

    console.log("🎉 EMAIL SENT! ID:", info.messageId);
    console.log("👉 Go check your Docker setup, because the key is fine.");

  } catch (error) {
    console.error("❌ FAILED.");
    console.error("Error Code:", error.responseCode);
    console.error("Message:", error.message);
    
    if (error.responseCode === 535) {
      console.log("\n⚠️ DIAGNOSIS: The Key or Email is definitely wrong.");
      console.log("1. Check if SMTP_USER is exactly your login email.");
      console.log("2. Check if the Key has hidden spaces.");
      console.log("3. Is your Brevo account 'Activated' yet? (Check dashboard)");
    }
  }
}

testBrevo();