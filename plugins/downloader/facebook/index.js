const axios = require("axios");

module.exports = {
  name: "facebook",
  aliases: ["fb", "fbdl", "facebookv3"],
  category: "downloader",
  description: "Download Facebook Reels and Videos (V3 High Speed).",
  async execute(sock, m, args, config) {
    const url = args[0];
    if (!url) {
      return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide a Facebook URL." }, { quoted: m });
    }

    // --- Loading Animation ---
    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "📘 *Fetching Facebook Media (V3)...*" }, { quoted: m });
    const frames = ["🔹 [□□□□□□□□□□]", "🔹 [■■■□□□□□□□]", "🔹 [■■■■■■□□□□]", "🔹 [■■■■■■■■■□]", "✅ *Ready!*"];
    
    const animate = async () => {
      for (let i = 0; i < frames.length - 1; i++) {
        await new Promise(r => setTimeout(r, 300));
        await sock.sendMessage(m.key.remoteJid, { text: frames[i], edit: loadingMsg.key });
      }
    };
    animate();

    try {
      // Using Facebook V3 for high speed and direct download
      const apiUrl = `https://api.giftedtech.co.ke/api/download/facebookv3?apikey=${config.GIFTED_API_KEY}&url=${encodeURIComponent(url)}`;
      const { data } = await axios.get(apiUrl);

      if (!data || data.status !== 200 || !data.result) {
        throw new Error("Invalid API response");
      }

      const result = data.result;
      const videoUrl = result.download_url;
      const fileName = result.filename || "facebook_video.mp4";

      const caption = `*乂 FACEBOOK DOWNLOADER V3 乂*\n\n` +
                      `📦 *File:* ${fileName}\n` +
                      `🌐 *Platform:* ${result.platform.toUpperCase()}\n\n` +
                      `_Downloaded via ${config.BOT_NAME}_`;

      await sock.sendMessage(m.key.remoteJid, { text: "✅ *Media Found!* Sending video...", edit: loadingMsg.key });
      await sock.sendMessage(m.key.remoteJid, { react: { text: "🎬", key: m.key } });

      await sock.sendMessage(m.key.remoteJid, {
        video: { url: videoUrl },
        caption: caption
      }, { quoted: m });

    } catch (error) {
      console.error("Facebook V3 DL Error:", error.message);
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to download Facebook video. Please check the link and try again.", edit: loadingMsg.key });
    }
  }
};
