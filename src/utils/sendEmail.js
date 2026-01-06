// src/utils/sendEmail.js
const sgMail = require("@sendgrid/mail");

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const FROM_EMAIL = process.env.FROM_EMAIL || "arpanjain00123@gmail.com";

if (!SENDGRID_API_KEY) {
  console.error("SENDGRID_API_KEY is not set");
} else {
  sgMail.setApiKey(SENDGRID_API_KEY);
}

/**
 * Generic email helper
 * @param {object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} [options.text] - Plain text body
 * @param {string} [options.html] - HTML body (optional but preferred)
 */
async function sendEmail({ to, subject, text, html }) {
  if (!SENDGRID_API_KEY) {
    console.error("SENDGRID_API_KEY is not set");
    return;
  }

  if (!to || !subject) {
    console.error("sendEmail missing to/subject", { to, subject });
    return;
  }

  const msg = {
    to,
    from: {
      email: FROM_EMAIL,
      name: "CampusFlow by UrbanTales",
    },
    subject,
    // text fallback so that even if HTML supported nahi ho, message readable rahe
    text: text || (html ? stripHtml(html) : ""),
    html,
  };

  try {
    const [response] = await sgMail.send(msg);
    console.log("Email sent via SendGrid:", response.statusCode);
  } catch (err) {
    console.error("SendGrid sendEmail error:");
    console.error("Status code:", err.code || err.response?.statusCode);
    if (err.response?.body) {
      console.error("Error body:", JSON.stringify(err.response.body, null, 2));
    } else {
      console.error(err);
    }
    // error upar bubble karna ho to:
    // throw err;
  }
}

/**
 * Very simple HTML → text fallback
 */
function stripHtml(html) {
  return html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

module.exports = sendEmail;
