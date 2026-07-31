const axios = require("axios");

module.exports = {
  name: "tiktok",
  aliases: ["tt", "ttdl", "tiktoknowm", "ttv4"],
  category: "downloader",
  description: "Download TikTok videos without watermark (V4).",
  async execute(sock, m, args, config) {
    const url = args[0];
    if (!url) {
      return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide a TikTok URL." }, { quoted: m });
    }

    // --- Loading Animation ---
    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "📥 *Fetching TikTok Video (V4)...*" }, { quoted: m });
    const frames = ["⏳ [■□□□□□□□□□]", "⏳ [■■■□□□□□□□]", "⏳ [■■■■■■□□□□]", "⏳ [■■■■■■■■■□]", "✅ *Success!*"];
    
    const animate = async () => {
      for (let i = 0; i < frames.length - 1; i++) {
        await new Promise(r => setTimeout(r, 300));
        await sock.sendMessage(m.key.remoteJid, { text: frames[i], edit: loadingMsg.key });
      }
    };
    animate();

    try {
      // Using TikTok V4 for HD and No Watermark support
      const apiUrl = `https://api.giftedtech.co.ke/api/download/tiktokdlv4?apikey=${config.GIFTED_API_KEY}&url=${encodeURIComponent(url)}`;
      const { data } = await axios.get(apiUrl);

      if (!data || data.status !== 200 || !data.result) {
        throw new Error("Invalid API response");
      }

      const result = data.result;
      const videoUrl = result.video_nowm || result.video_hd || result.videoUrl;
      
      const caption = `*乂 TIKTOK DOWNLOADER V4 乂*\n\n` +
                      `👤 *Username:* ${result.username || "Unknown"}\n` +
                      `📝 *Title:* ${result.title || "No Title"}\n` +
                      `🕒 *Duration:* ${result.duration}s\n\n` +
                      `_Downloaded via ${config.BOT_NAME}_`;

      await sock.sendMessage(m.key.remoteJid, { text: "✅ *Video Found!* Sending...", edit: loadingMsg.key });
      await sock.sendMessage(m.key.remoteJid, { react: { text: "🎬", key: m.key } });

      await sock.sendMessage(m.key.remoteJid, {
        video: { url: videoUrl },
        caption: caption
      }, { quoted: m });

      // Optional: Send Audio if requested? Or just focus on Video for now.
    } catch (error) {
      console.error("TikTok V4 DL Error:", error.message);
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to download TikTok video. Ensure the link is valid.", edit: loadingMsg.key });
    }
  }
};
