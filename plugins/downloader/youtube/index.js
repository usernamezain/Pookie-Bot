const axios = require("axios");

module.exports = [
  {
    name: "ytmp4",
    aliases: ["ytv", "ytvideo"],
    category: "downloader",
    description: "Download YouTube videos (720p).",
    async execute(sock, m, args, config) {
      const url = args[0];
      if (!url) return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide a YouTube URL." }, { quoted: m });

      const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🎬 *Processing YouTube Video...*" }, { quoted: m });
      
      try {
        const { data } = await axios.get(`https://api.giftedtech.co.ke/api/download/ytmp4?apikey=${config.GIFTED_API_KEY}&url=${encodeURIComponent(url)}&quality=720p`);
        
        if (data.status !== 200 || !data.result) throw new Error("API Error");

        const result = data.result;
        await sock.sendMessage(m.key.remoteJid, { text: "✅ *Download Ready!* Sending video...", edit: loadingMsg.key });
        
        await sock.sendMessage(m.key.remoteJid, {
          video: { url: result.download_url },
          caption: `✅ *YouTube MP4*\n\n📌 *Title:* ${result.title}\n📊 *Quality:* ${result.quality}\n\n_Downloaded via ${config.BOT_NAME}_`
        }, { quoted: m });
      } catch (e) {
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to download YouTube video.", edit: loadingMsg.key });
      }
    }
  },
  {
    name: "ytmp3",
    aliases: ["yta", "ytaudio"],
    category: "downloader",
    description: "Download YouTube MP3 (128kbps).",
    async execute(sock, m, args, config) {
      const url = args[0];
      if (!url) return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide a YouTube URL." }, { quoted: m });

      const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🎵 *Extracting YouTube Audio...*" }, { quoted: m });
      
      try {
        const { data } = await axios.get(`https://api.giftedtech.co.ke/api/download/ytmp3?apikey=${config.GIFTED_API_KEY}&url=${encodeURIComponent(url)}&quality=128kbps`);
        
        if (data.status !== 200 || !data.result) throw new Error("API Error");

        const result = data.result;
        await sock.sendMessage(m.key.remoteJid, { text: "✅ *Audio Ready!* Sending MP3...", edit: loadingMsg.key });
        
        await sock.sendMessage(m.key.remoteJid, {
          audio: { url: result.download_url },
          mimetype: "audio/mpeg",
          fileName: `${result.title}.mp3`
        }, { quoted: m });
      } catch (e) {
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to extract audio.", edit: loadingMsg.key });
      }
    }
  }
];
