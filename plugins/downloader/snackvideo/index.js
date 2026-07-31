const axios = require("axios");

module.exports = {
  name: "snackvideo",
  aliases: ["snack", "snackdl"],
  category: "downloader",
  description: "Download videos from SnackVideo.",
  async execute(sock, m, args, config) {
    const url = args[0];
    if (!url) return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide a SnackVideo URL." }, { quoted: m });

    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🍿 *Fetching SnackVideo...*" }, { quoted: m });
    
    try {
      const { data } = await axios.get(`https://api.giftedtech.co.ke/api/download/snackdl?apikey=${config.GIFTED_API_KEY}&url=${encodeURIComponent(url)}`);
      
      if (data.status !== 200 || !data.result) throw new Error("API Error");

      const result = data.result;
      const videoUrl = result.media || result.download_url; // Use media or fallback
      
      const caption = `✅ *SnackVideo Downloaded*\n\n📌 *Title:* ${result.title || "No Title"}\n👤 *Author:* ${result.author || "Unknown"}\n\n_Downloaded via ${config.BOT_NAME}_`;

      await sock.sendMessage(m.key.remoteJid, { text: "✅ *Media Found!* Sending...", edit: loadingMsg.key });
      
      await sock.sendMessage(m.key.remoteJid, {
        video: { url: videoUrl },
        caption: caption
      }, { quoted: m });

    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to download SnackVideo.", edit: loadingMsg.key });
    }
  }
};
