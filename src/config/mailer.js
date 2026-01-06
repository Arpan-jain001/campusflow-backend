// src/config/mailer.js
const sgMail = require("@sendgrid/mail");

// Load from env
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "arpanjain00123@gmail.com";

// Basic sanity logs (debug ke liye, prefix only)
console.log(
  "SENDGRID key present?",
  !!SENDGRID_API_KEY,
  SENDGRID_API_KEY ? SENDGRID_API_KEY.slice(0, 10) : null
);
console.log("FROM_EMAIL:", FROM_EMAIL);

if (!SENDGRID_API_KEY) {
  console.error("❌ SENDGRID_API_KEY is not set");
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
  console.log("✅ SendGrid API key configured");
}

async function sendMail({ to, subject, html }) {
  if (!SENDGRID_API_KEY) {
    console.error("❌ SENDGRID_API_KEY is not set, cannot send email");
    return;
  }

  const msg = {
    to,
    from: {
      email: FROM_EMAIL,
      name: "CampusFlow by UrbanTales",
    },
    subject,
    html,
  };

  try {
    const [response] = await sgMail.send(msg);
    console.log("✅ Email sent via SendGrid:", response.statusCode);
    return response;
  } catch (err) {
    console.error("❌ SendGrid sendMail error:");
    console.error("Status code:", err.code || err.response?.statusCode);
    if (err.response?.body) {
      console.error("Error body:", JSON.stringify(err.response.body, null, 2));
    } else {
      console.error(err);
    }
    throw err; // controller catch karega aur 500 bhej sakta hai
  }
}

// transporter ab needed nahi, but export structure same rakhne ke liye null
module.exports = { transporter: null, sendMail };
