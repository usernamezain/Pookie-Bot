const fs = require("fs");
const path = require("path");

const mediaDir = path.join(__dirname, "..", "..", "..", "media");

module.exports = {
  name: "delfile",
  aliases: ["delmedia", "rmfile"],
  category: "media",
  description: "Delete a file from the local media folder.",
  async execute(sock, m, args) {
    const filename = args.join(" ");
    if (!filename) {
      return sock.sendMessage(m.key.remoteJid, { 
        text: "❌ *Filename Required*\n\n*Usage:* `.delfile <filename>`\n*Example:* `.delfile old_photo.jpg`" 
      }, { quoted: m });
    }

    // Security: Prevent path traversal
    if (filename.includes("..") || filename.includes("/") || filename.includes("\\")) {
      return sock.sendMessage(m.key.remoteJid, { text: "❌ *Security Error:* Invalid filename detected." }, { quoted: m });
    }

    const filePath = path.join(mediaDir, filename);

    if (!fs.existsSync(filePath)) {
      return sock.sendMessage(m.key.remoteJid, { 
        text: `❌ *File Not Found:* "${filename}"` 
      }, { quoted: m });
    }

    // --- Loading Animation Logic ---
    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🗑️ *Deleting File...*" }, { quoted: m });
    const frames = [
      "⏳ [■□□□□□□□□□] 10%",
      "🗑️ [■■■□□□□□□□] 30%",
      "🗑️ [■■■■■■□□□□] 60%",
      "🧹 [■■■■■■■■■□] 90%",
      "✅ *File Removed!*"
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
      await sock.sendMessage(m.key.remoteJid, { react: { text: "🗑️", key: m.key } });

      fs.unlinkSync(filePath);

      // Finish the animation
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });

      await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: `✅ *Success:* File *${filename}* has been permanently deleted from your local storage.` }, { quoted: m });

    } catch (error) {
      console.error("Delfile Error:", error.message);
      await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to delete the file. It might be in use or protected." }, { quoted: m });
    }
  }
};
