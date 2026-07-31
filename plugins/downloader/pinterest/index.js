const axios = require("axios");

module.exports = {
  name: "pinterest",
  aliases: ["pin", "pindl", "pinv4"],
  category: "downloader",
  description: "Download Pinterest images and videos (V4).",
  async execute(sock, m, args, config) {
    const url = args[0];
    if (!url) return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide a Pinterest URL." }, { quoted: m });

    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "📌 *Fetching Pinterest Media (V4)...*" }, { quoted: m });
    
    try {
      const { data } = await axios.get(`https://api.giftedtech.co.ke/api/download/pinterestv4?apikey=${config.GIFTED_API_KEY}&url=${encodeURIComponent(url)}`);
      
      if (data.status !== 200 || !data.result) throw new Error("API Error");

      const result = data.result;
      // Get the highest quality video or image
      const bestMedia = result.medias.sort((a, b) => parseInt(b.quality) - parseInt(a.quality))[0];
      
      const caption = `✅ *Pinterest Downloaded*\n\n📌 *Title:* ${result.title || "No Title"}\n🕒 *Duration:* ${result.duration || "N/A"}\n\n_Downloaded via ${config.BOT_NAME}_`;

      await sock.sendMessage(m.key.remoteJid, { text: "✅ *Media Found!* Sending...", edit: loadingMsg.key });
      await sock.sendMessage(m.key.remoteJid, { react: { text: "📌", key: m.key } });

      const type = bestMedia.extension === "mp4" ? "video" : "image";
      
      await sock.sendMessage(m.key.remoteJid, {
        [type]: { url: bestMedia.url },
        caption: caption
      }, { quoted: m });

    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to download Pinterest media.", edit: loadingMsg.key });
    }
  }
};
