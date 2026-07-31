const axios = require("axios");

module.exports = {
  name: "gdrive",
  aliases: ["gd", "gdrivedl", "drive"],
  category: "downloader",
  description: "Download files from Google Drive.",
  async execute(sock, m, args, config) {
    const url = args[0];
    if (!url) return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide a Google Drive URL." }, { quoted: m });

    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "☁️ *Fetching Google Drive File...*" }, { quoted: m });
    
    try {
      const { data } = await axios.get(`https://api.giftedtech.co.ke/api/download/gdrivedl?apikey=${config.GIFTED_API_KEY}&url=${encodeURIComponent(url)}`);
      
      if (data.status !== 200 || !data.result) throw new Error("API Error");

      const result = data.result;
      const downloadUrl = result.download_url;
      const fileName = result.name || "gdrive_file";

      await sock.sendMessage(m.key.remoteJid, { text: `✅ *File Found:* ${fileName}\n\n*Size:* Fetching...`, edit: loadingMsg.key });
      
      // Determine file type for proper sending
      const isImage = fileName.match(/\.(jpg|jpeg|png|webp)$/i);
      const isVideo = fileName.match(/\.(mp4|mkv|avi|mov)$/i);
      const isAudio = fileName.match(/\.(mp3|wav|ogg|m4a)$/i);

      let sendMsg = { document: { url: downloadUrl }, fileName, mimetype: "application/octet-stream" };
      
      if (isImage) sendMsg = { image: { url: downloadUrl }, caption: fileName };
      else if (isVideo) sendMsg = { video: { url: downloadUrl }, caption: fileName };
      else if (isAudio) sendMsg = { audio: { url: downloadUrl }, mimetype: "audio/mpeg" };

      await sock.sendMessage(m.key.remoteJid, sendMsg, { quoted: m });
      await sock.sendMessage(m.key.remoteJid, { text: "✅ *Download Complete!*", edit: loadingMsg.key });

    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to download Google Drive file. Ensure the link is public.", edit: loadingMsg.key });
    }
  }
};
