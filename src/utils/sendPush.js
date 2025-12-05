const { Expo } = require("expo-server-sdk");
const expo = new Expo();

async function sendPushNotification(pushTokens, title, body, data = {}) {
  const messages = [];
  for (let token of pushTokens) {
    if (!Expo.isExpoPushToken(token)) continue;
    messages.push({
      to: token,
      sound: "default",
      title,
      body,
      data,
    });
  }

  let chunks = expo.chunkPushNotifications(messages);
  for (let chunk of chunks) {
    try {
      await expo.sendPushNotificationsAsync(chunk);
    } catch (err) {
      console.error("Expo push chunk error:", err);
    }
  }
}

module.exports = { sendPushNotification };
