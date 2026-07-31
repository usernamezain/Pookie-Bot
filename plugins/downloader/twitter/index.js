const axios = require("axios");

module.exports = {
  name: "twitter",
  aliases: ["tw", "twdl", "x", "xdl"],
  category: "downloader",
  description: "Download Twitter/X videos in multiple qualities.",
  async execute(sock, m, args, config) {
    const url = args[0];
    if (!url) return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide a Twitter/X URL." }, { quoted: m });

    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🐦 *Fetching Twitter Video...*" }, { quoted: m });
    
    try {
      const { data } = await axios.get(`https://api.giftedtech.co.ke/api/download/twitter?apikey=${config.GIFTED_API_KEY}&url=${encodeURIComponent(url)}`);
      
      if (data.status !== 200 || !data.result) throw new Error("API Error");

      const result = data.result;
      // Get the highest quality video
      const bestVideo = result.videoUrls.sort((a, b) => parseInt(b.quality) - parseInt(a.quality))[0];
      
      const caption = `✅ *Twitter/X Video Downloaded*\n\n📊 *Quality:* ${bestVideo.quality}\n\n_Downloaded via ${config.BOT_NAME}_`;

      await sock.sendMessage(m.key.remoteJid, { text: "✅ *Media Found!* Sending video...", edit: loadingMsg.key });
      await sock.sendMessage(m.key.remoteJid, { react: { text: "🐦", key: m.key } });

      await sock.sendMessage(m.key.remoteJid, {
        video: { url: bestVideo.url },
        caption: caption
      }, { quoted: m });

    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to download Twitter video.", edit: loadingMsg.key });
    }
  }
};
