const axios = require("axios");

module.exports = {
  name: "istock",
  aliases: ["istockdl", "istockdownload"],
  category: "downloader",
  description: "Download image or video from iStock URL without watermarks.",
  async execute(sock, m, args, config) {
    const url = args?.[0]?.trim();

    if (!url) {
      return sock.sendMessage(m.key.remoteJid, { 
        text: "🖼️ *iStock Downloader*\n\n*Usage:* `.istock <iStock_URL>`\n*Example:* `.istock https://www.istockphoto.com/photo/...`" 
      }, { quoted: m });
    }

    try {
      await sock.sendMessage(m.key.remoteJid, { react: { text: "⏳", key: m.key } });

      const apiUrl = `https://discardapi.dpdns.org/api/dl/istock?apikey=${process.env.GURU_API_KEY || "guru"}&url=${encodeURIComponent(url)}`;
      const { data } = await axios.get(apiUrl, { timeout: 15000 });

      if (!data?.status || !data.result) {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
        return sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to fetch media from the provided iStock URL." }, { quoted: m });
      }

      const item = data.result;

      await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });

      if (item.video) {
        await sock.sendMessage(m.key.remoteJid, { 
          video: { url: item.video }, 
          caption: `*乂 ISTOCK VIDEO 乂*\n\nDownloaded via ${config.BOT_NAME}` 
        }, { quoted: m });
      } else if (item.image) {
        await sock.sendMessage(m.key.remoteJid, { 
          image: { url: item.image }, 
          caption: `*乂 ISTOCK IMAGE 乂*\n\nDownloaded via ${config.BOT_NAME}` 
        }, { quoted: m });
      }

    } catch (error) {
      console.error("iStock download error:", error.message);
      await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });

      if (error.code === "ECONNABORTED") {
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Request timed out. The API may be slow or unreachable." }, { quoted: m });
      } else {
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to download media from iStock URL." }, { quoted: m });
      }
    }
  }
};
