const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // TLS
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendMail({ to, subject, html }) {
  const from = `"CampusFlow by UrbanTales" <${process.env.GMAIL_USER}>`;

  const info = await transporter.sendMail({
    from,
    to,
    subject,
    html,
  });

  console.log("Email sent:", info.messageId);
}

module.exports = { transporter, sendMail };
