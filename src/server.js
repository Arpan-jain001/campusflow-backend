// src/server.js
const dotenv = require("dotenv");
dotenv.config();

const app = require("./app");
const connectDB = require("./config/db");
const ensureAdmin = require("./utils/ensureAdmin");

const PORT = process.env.PORT || 5000;

async function start() {
  try {
    // 1) Mongo connect
    await connectDB();                   // 👈 yahan await

    // 2) Server listen
    app.listen(PORT, async () => {
      console.log(`Server running on port ${PORT}`);

      // 3) Admin seed – ab connection open hai
      try {
        await ensureAdmin();
      } catch (e) {
        console.error("ensureAdmin error:", e.message);
      }
    });
  } catch (err) {
    console.error("Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
