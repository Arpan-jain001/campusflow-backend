// src/config/mailer.js
const sgMail = require("@sendgrid/mail");

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "arpanjain00123@gmail.com";

if (!SENDGRID_API_KEY) {
  console.error("SENDGRID_API_KEY is not set");
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

async function sendMail({ to, subject, html }) {
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
    html,
  };

  const [response] = await sgMail.send(msg);
  console.log("Email sent via SendGrid:", response.statusCode);
}

// transporter ab needed nahi, but export structure same rakhne ke liye null
module.exports = { transporter: null, sendMail };
