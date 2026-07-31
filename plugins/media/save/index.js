const fs = require("fs");
const path = require("path");
const { downloadMedia } = require("../../../lib/utils");

const mediaDir = path.join(__dirname, "..", "..", "..", "media");

module.exports = {
  name: "savefile",
  aliases: ["savemedia", "sv"],
  category: "media",
  description: "Save replied media to the local media folder.",
  async execute(sock, m, args) {
    const filename = args.join(" ");
    if (!filename) {
      return sock.sendMessage(m.key.remoteJid, { 
        text: "❌ *Filename Required*\n\n*Usage:* Reply to a media message with `.savefile <name.ext>`\n*Example:* `.savefile cool_video.mp4`" 
      }, { quoted: m });
    }

    const quoted = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
    if (!quoted) {
      return sock.sendMessage(m.key.remoteJid, { text: "❌ Please reply to an image, video, audio, or document to save it." }, { quoted: m });
    }

    const mediaType = Object.keys(quoted)[0];
    const supportedTypes = ["imageMessage", "videoMessage", "audioMessage", "documentMessage"];
    
    if (!supportedTypes.includes(mediaType)) {
      return sock.sendMessage(m.key.remoteJid, { text: "❌ The replied message does not contain supported media." }, { quoted: m });
    }

    // --- Loading Animation Logic ---
    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "📥 *Downloading Media...*" }, { quoted: m });
    const frames = [
      "⏳ [■□□□□□□□□□] 10%",
      "📥 [■■■□□□□□□□] 30%",
      "📥 [■■■■■■□□□□] 60%",
      "💾 [■■■■■■■■■□] 90%",
      "✅ *Saved Successfully!*"
    ];

    const animate = async () => {
      for (let i = 0; i < frames.length - 1; i++) {
        await new Promise(resolve => setTimeout(resolve, 400));
        await sock.sendMessage(m.key.remoteJid, { text: frames[i], edit: loadingMsg.key });
      }
    };

    // Start animation in parallel
    animate();

    try {
      await sock.sendMessage(m.key.remoteJid, { react: { text: "📥", key: m.key } });

      const buffer = await downloadMedia(quoted[mediaType], mediaType.replace("Message", ""));
      const filePath = path.join(mediaDir, filename);
      
      if (!fs.existsSync(mediaDir)) {
        fs.mkdirSync(mediaDir, { recursive: true });
      }

      fs.writeFileSync(filePath, buffer);

      // Finish the animation
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });

      const stats = fs.statSync(filePath);
      const size = (stats.size / 1024 / 1024).toFixed(2);

      await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { 
        text: `✅ *Media Saved!*\n\n📄 *Name:* ${filename}\n⚖️ *Size:* ${size} MB\n📍 *Path:* media/${filename}\n\n_Use .media to retrieve it later._` 
      }, { quoted: m });

    } catch (error) {
      console.error("Savefile Error:", error.message);
      await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to download and save the media." }, { quoted: m });
    }
  }
};
