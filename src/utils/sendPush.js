const { Expo } = require("expo-server-sdk");

const expo = new Expo();

async function sendPushNotification(tokens, title, body, data = {}) {
  try {
    if (!tokens || !tokens.length) {
      console.log("sendPushNotification: no tokens passed");
      return;
    }

    const validTokens = tokens.filter((t) => Expo.isExpoPushToken(t));
    if (!validTokens.length) {
      console.log("sendPushNotification: no valid Expo tokens", tokens);
      return;
    }

    const messages = validTokens.map((token) => ({
      to: token,
      sound: "default",
      title,
      body,
      data,
    }));

    console.log("sendPushNotification: sending messages", messages.length);

    const chunks = expo.chunkPushNotifications(messages);
    for (const chunk of chunks) {
      const tickets = await expo.sendPushNotificationsAsync(chunk);
      console.log("Expo push tickets:", tickets);
    }
  } catch (err) {
    console.error("Expo push send error", err);
  }
}

module.exports = { sendPushNotification };
