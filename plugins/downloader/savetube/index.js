const axios = require("axios");

module.exports = [
  {
    name: "savetubemp3",
    aliases: ["svmp3", "svaudio", "svsong"],
    category: "downloader",
    description: "Download YouTube audio via SaveTube.",
    async execute(sock, m, args, config) {
      const url = args[0];
      if (!url) return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide a YouTube URL." }, { quoted: m });

      const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🎵 *Fetching SaveTube Audio...*" }, { quoted: m });
      
      try {
        const { data } = await axios.get(`https://api.giftedtech.co.ke/api/download/savetubemp3?apikey=${config.GIFTED_API_KEY}&url=${encodeURIComponent(url)}`);
        
        if (data.status !== 200 || !data.result) throw new Error("API Error");

        const result = data.result;
        await sock.sendMessage(m.key.remoteJid, { text: "✅ *Audio Ready!* Sending...", edit: loadingMsg.key });
        
        await sock.sendMessage(m.key.remoteJid, {
          audio: { url: result.download_url },
          mimetype: "audio/mpeg",
          fileName: `${result.title}.mp3`,
          contextInfo: {
            externalAdReply: {
              title: result.title,
              body: `Quality: ${result.quality}`,
              thumbnailUrl: result.thumbnail,
              sourceUrl: url,
              mediaType: 1,
              showAdAttribution: true
            }
          }
        }, { quoted: m });
      } catch (e) {
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to download audio via SaveTube.", edit: loadingMsg.key });
      }
    }
  },
  {
    name: "savetubemp4",
    aliases: ["svmp4", "svvideo", "svdl"],
    category: "downloader",
    description: "Download YouTube video via SaveTube.",
    async execute(sock, m, args, config) {
      const url = args[0];
      if (!url) return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide a YouTube URL." }, { quoted: m });

      const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🎬 *Fetching SaveTube Video...*" }, { quoted: m });
      
      try {
        const { data } = await axios.get(`https://api.giftedtech.co.ke/api/download/savetubemp4?apikey=${config.GIFTED_API_KEY}&url=${encodeURIComponent(url)}`);
        
        if (data.status !== 200 || !data.result) throw new Error("API Error");

        const result = data.result;
        await sock.sendMessage(m.key.remoteJid, { text: "✅ *Video Ready!* Sending...", edit: loadingMsg.key });
        
        await sock.sendMessage(m.key.remoteJid, {
          video: { url: result.download_url },
          caption: `✅ *SaveTube MP4*\n\n📌 *Title:* ${result.title}\n📊 *Quality:* ${result.quality}\n\n_Downloaded via ${config.BOT_NAME}_`
        }, { quoted: m });
      } catch (e) {
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to download video via SaveTube.", edit: loadingMsg.key });
      }
    }
  }
];
