const fs = require("fs");
const path = require("path");

const mediaDir = path.join(__dirname, "..", "..", "..", "media");

module.exports = {
  name: "media",
  aliases: ["localfile", "getfile"],
  category: "media",
  description: "Send a saved file from the local media folder.",
  async execute(sock, m, args) {
    const filename = args.join(" ");
    if (!filename) {
      return sock.sendMessage(m.key.remoteJid, { 
        text: "❌ *Filename Required*\n\n*Usage:* `.media <filename>`\n*Example:* `.media myvideo.mp4`" 
      }, { quoted: m });
    }

    const filePath = path.join(mediaDir, filename);

    if (!fs.existsSync(filePath)) {
      return sock.sendMessage(m.key.remoteJid, { 
        text: `❌ *File Not Found:* "${filename}"\n\nUse \`.locallist\` to see all available files.` 
      }, { quoted: m });
    }

    // --- Loading Animation Logic ---
    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "📤 *Preparing File for Upload...*" }, { quoted: m });
    const frames = [
      "⏳ [■□□□□□□□□□] 10%",
      "⏳ [■■■□□□□□□□] 30%",
      "⏳ [■■■■■■□□□□] 60%",
      "⏳ [■■■■■■■■■□] 90%",
      "✅ *Uploading...*"
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
      await sock.sendMessage(m.key.remoteJid, { react: { text: "📤", key: m.key } });

      const ext = path.extname(filename).toLowerCase();
      const fileBuffer = fs.readFileSync(filePath);

      // Finish the animation
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });

      if ([".jpg", ".jpeg", ".png", ".webp"].includes(ext)) {
        await sock.sendMessage(m.key.remoteJid, { image: fileBuffer, caption: `📄 *File:* ${filename}` }, { quoted: m });
      } else if ([".mp4", ".avi", ".mkv"].includes(ext)) {
        await sock.sendMessage(m.key.remoteJid, { video: fileBuffer, caption: `📄 *File:* ${filename}` }, { quoted: m });
      } else if ([".mp3", ".ogg", ".wav", ".m4a"].includes(ext)) {
        await sock.sendMessage(m.key.remoteJid, { audio: fileBuffer, mimetype: "audio/mp4", ptt: false }, { quoted: m });
      } else {
        await sock.sendMessage(m.key.remoteJid, { 
          document: fileBuffer, 
          fileName: filename, 
          mimetype: "application/octet-stream" 
        }, { quoted: m });
      }

      await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });

    } catch (error) {
      console.error("Media Send Error:", error.message);
      await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to send the file. It might be too large or corrupted." }, { quoted: m });
    }
  }
};
