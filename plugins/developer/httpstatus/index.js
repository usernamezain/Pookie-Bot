const axios = require("axios");
const { STATUS_CODES } = require("http");

module.exports = {
  name: "httpstatus",
  aliases: ["http", "statuscode"],
  category: "developer",
  description: "Get visual info and descriptions for HTTP status codes.",
  async execute(sock, m, args) {
    const code = args[0];
    if (!code) {
      return sock.sendMessage(m.key.remoteJid, { 
        text: "🌐 *HTTP Status Helper*\n\n*Usage:*\n• `.http <code>`\n\n*Example:* `.http 404`" 
      }, { quoted: m });
    }

    try {
      // Using http.cat for images
      const imageUrl = `https://http.cat/${code}.jpg`;
      const description = STATUS_CODES[code] || "Unknown Status";

      // Check if the status code exists on http.cat
      try {
        await axios.head(imageUrl);
      } catch (e) {
        return sock.sendMessage(m.key.remoteJid, { text: `❌ Invalid or unsupported HTTP status code: ${code}` }, { quoted: m });
      }

      await sock.sendMessage(m.key.remoteJid, {
        image: { url: imageUrl },
        caption: `🌐 *HTTP ${code}: ${description}*`
      }, { quoted: m });

    } catch (error) {
      console.error("HTTP Command Error:", error.message);
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to fetch info." }, { quoted: m });
    }
  }
};

