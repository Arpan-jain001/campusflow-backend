// src/utils/sendEmail.js
const sgMail = require("@sendgrid/mail");

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "arpanjain00123@gmail.com";

if (!SENDGRID_API_KEY) {
  console.error("SENDGRID_API_KEY is not set");
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

async function sendEmail(to, subject, text) {
  if (!SENDGRID_API_KEY) {
    console.error("SENDGRID_API_KEY is not set");
    return;
  }

  const msg = {
    to,
    from: {
      email: FROM_EMAIL,
      name: "CampusFlow by UrbanTales",
    },
    subject,
    text, // yahi text tum OTP ke liye bhej rahe ho
  };

  await sgMail.send(msg);
}

module.exports = sendEmail;
