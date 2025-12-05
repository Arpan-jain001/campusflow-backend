const axios = require("axios");

const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function sendMail({ to, subject, html }) {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set");
    return;
  }

  const from = "CampusFlow by UrbanTales <no-reply@campusflow.app>";

  const res = await axios.post(
    "https://api.resend.com/emails",
    {
      from,
      to,
      subject,
      html,
    },
    {
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );

  console.log("Email sent via Resend:", res.data?.id || "");
}

// Nodemailer transporter ki jagah yahan null export kar rahe,
// taaki agar kahin se destructuring ho to crash na ho.
module.exports = { transporter: null, sendMail };
