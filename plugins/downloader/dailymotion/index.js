const axios = require("axios");

module.exports = {
  name: "dailymotion",
  aliases: ["dm", "dmdl"],
  category: "downloader",
  description: "Download videos from Dailymotion.",
  async execute(sock, m, args, config) {
    const url = args[0];
    if (!url) return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide a Dailymotion URL." }, { quoted: m });

    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🎬 *Fetching Dailymotion Video...*" }, { quoted: m });
    
    try {
      const { data } = await axios.get(`https://api.giftedtech.co.ke/api/download/dailymotion?apikey=${config.GIFTED_API_KEY}&url=${encodeURIComponent(url)}`);
      
      if (data.status !== 200 || !data.result) throw new Error("API Error");

      const result = data.result;
      // Get the highest quality format (excluding manifest links if possible, but the API seems to provide direct urls)
      // Usually formats are sorted, or we can look for "hls-1080" etc.
      const bestFormat = result.formats.sort((a, b) => {
        const qA = parseInt(a.quality.split("-")[1]) || 0;
        const qB = parseInt(b.quality.split("-")[1]) || 0;
        return qB - qA;
      })[0];
      
      const caption = `✅ *Dailymotion Downloaded*\n\n📌 *Title:* ${result.title}\n🕒 *Duration:* ${result.duration}\n📊 *Quality:* ${bestFormat.quality}\n\n_Downloaded via ${config.BOT_NAME}_`;

      await sock.sendMessage(m.key.remoteJid, { text: "✅ *Video Found!* Sending...", edit: loadingMsg.key });
      await sock.sendMessage(m.key.remoteJid, { react: { text: "🎬", key: m.key } });

      await sock.sendMessage(m.key.remoteJid, {
        video: { url: bestFormat.url },
        caption: caption
      }, { quoted: m });

    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to download Dailymotion video.", edit: loadingMsg.key });
    }
  }
};
