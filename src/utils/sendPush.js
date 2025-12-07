const { Expo } = require("expo-server-sdk");

const expo = new Expo();

async function sendPushNotification(tokens, title, body, data = {}) {
  try {
    if (!tokens || !tokens.length) return;

    const validTokens = tokens.filter((t) => Expo.isExpoPushToken(t));
    if (!validTokens.length) {
      console.log("No valid Expo tokens");
      return;
    }

    const messages = validTokens.map((token) => ({
      to: token,
      sound: "default",
      title,
      body,
      data,
    }));

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      await expo.sendPushNotificationsAsync(chunk);
    }
  } catch (err) {
    console.error("Expo push send error", err);
  }
}

module.exports = { sendPushNotification };
