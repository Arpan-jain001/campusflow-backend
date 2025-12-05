const axios = require("axios");

const RESEND_API_KEY = process.env.RESEND_API_KEY;

async function sendEmail(to, subject, text) {
  if (!RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not set");
    return;
  }

  await axios.post(
    "https://api.resend.com/emails",
    {
      from: "CampusFlow by UrbanTales <no-reply@campusflow.app>", // naam/email apna rakh sakta hai
      to,
      subject,
      text, // yahi text tum OTP message ke लिए bhej rahe ho
    },
    {
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
    }
  );
}

module.exports = sendEmail;
