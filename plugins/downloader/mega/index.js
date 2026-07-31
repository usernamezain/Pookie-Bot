const { File } = require("megajs");
const path = require("path");

module.exports = {
  name: "mega",
  aliases: ["megadl"],
  category: "downloader",
  description: "Download files from MEGA.nz links.",
  async execute(sock, m, args, config) {
    const url = args[0];
    if (!url) {
      return sock.sendMessage(m.key.remoteJid, { 
        text: "☁️ *MEGA Downloader*\n\n*Usage:* `.mega <mega_url>`\n*Example:* `.mega https://mega.nz/file/...`" 
      }, { quoted: m });
    }

    try {
      await sock.sendMessage(m.key.remoteJid, { react: { text: "⏳", key: m.key } });

      const file = File.fromURL(url);
      await file.loadAttributes();

      // Limit file size to 500MB to prevent memory issues
      if (file.size > 500 * 1024 * 1024) {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
        return sock.sendMessage(m.key.remoteJid, { text: "❌ *File too large:* Maximum allowed size is 500MB." }, { quoted: m });
      }

      await sock.sendMessage(m.key.remoteJid, { 
        text: `📦 *Downloading:* ${file.name}\n⚖️ *Size:* ${(file.size / 1024 / 1024).toFixed(2)} MB\n\nPlease wait...` 
      }, { quoted: m });

      const data = await file.downloadBuffer();
      
      await sock.sendMessage(m.key.remoteJid, {
        document: data,
        fileName: file.name,
        mimetype: "application/octet-stream",
        caption: `✅ *File:* ${file.name}\n\nDownloaded via ${config.BOT_NAME}`
      }, { quoted: m });

      await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });

    } catch (err) {
      console.error("MEGA download error:", err.message);
      await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: "❌ *Download Failed:* Check if the link is valid and public." }, { quoted: m });
    }
  }
};
