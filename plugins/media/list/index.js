const fs = require("fs");
const path = require("path");

const mediaDir = path.join(__dirname, "..", "..", "..", "media");

module.exports = {
  name: "locallist",
  aliases: ["mediafiles", "listmedia"],
  category: "media",
  description: "List all locally saved media files on the server.",
  async execute(sock, m) {
    // --- Loading Animation Logic ---
    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "📂 *Reading Media Directory...*" }, { quoted: m });
    const frames = [
      "📁 [■□□□□□□□□□] 10%",
      "📁 [■■■□□□□□□□] 30%",
      "📁 [■■■■■■□□□□] 60%",
      "📁 [■■■■■■■■■□] 90%",
      "✅ *Directory Scanned!*"
    ];

    const animate = async () => {
      for (let i = 0; i < frames.length - 1; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        await sock.sendMessage(m.key.remoteJid, { text: frames[i], edit: loadingMsg.key });
      }
    };

    // Start animation in parallel
    animate();

    try {
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }

      const files = fs.readdirSync(mediaDir);
      
      // Finish the animation
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });

      if (files.length === 0) {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "📂", key: m.key } });
        return sock.sendMessage(m.key.remoteJid, { text: "📂 *Media Folder Empty*\n\nYour local storage is currently empty. Use `.savefile` while replying to an image or video to save it here." }, { quoted: m });
      }

      let listText = `*乂 LOCAL MEDIA FILES 乂*\n\n`;
      files.forEach((file, index) => {
        const stats = fs.statSync(path.join(mediaDir, file));
        const size = (stats.size / 1024 / 1024).toFixed(2); // MB
        listText += `*${index + 1}.* 📄 ${file} _(${size} MB)_\n`;
      });
      
      listText += `\n*Usage:* \`.media <filename>\`\n_Generated via Pookie Bot_`;

      await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: listText }, { quoted: m });

    } catch (error) {
      console.error("Locallist Error:", error.message);
      await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to read the media directory." }, { quoted: m });
    }
  }
};
