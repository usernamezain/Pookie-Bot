const axios = require("axios");

module.exports = {
  name: "instagram",
  aliases: ["ig", "igdl", "reels", "instadlv2"],
  category: "downloader",
  description: "Download Instagram Reels and Videos (V2).",
  async execute(sock, m, args, config) {
    const url = args[0];
    if (!url) {
      return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide an Instagram URL." }, { quoted: m });
    }

    // --- Loading Animation ---
    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "📸 *Fetching Instagram Media (V2)...*" }, { quoted: m });
    const frames = ["📸 [□□□□□□□□□□]", "📸 [■■■□□□□□□□]", "📸 [■■■■■■□□□□]", "📸 [■■■■■■■■■□]", "✅ *Success!*"];
    
    const animate = async () => {
      for (let i = 0; i < frames.length - 1; i++) {
        await new Promise(r => setTimeout(r, 300));
        await sock.sendMessage(m.key.remoteJid, { text: frames[i], edit: loadingMsg.key });
      }
    };
    animate();

    try {
      // Using Instagram V2 for direct extraction
      const apiUrl = `https://api.giftedtech.co.ke/api/download/instadlv2?apikey=${config.GIFTED_API_KEY}&url=${encodeURIComponent(url)}`;
      const { data } = await axios.get(apiUrl);

      if (!data || data.status !== 200 || !data.result) {
        throw new Error("Invalid API response");
      }

      const result = data.result;
      const downloadUrl = result.download_url;
      const fileName = result.filename || "instagram_media.mp4";

      const caption = `*乂 INSTAGRAM DOWNLOADER V2 乂*\n\n` +
                      `📦 *File:* ${fileName}\n` +
                      `🌐 *Platform:* ${result.platform.toUpperCase()}\n\n` +
                      `_Downloaded via ${config.BOT_NAME}_`;

      await sock.sendMessage(m.key.remoteJid, { text: "✅ *Media Found!* Sending...", edit: loadingMsg.key });
      await sock.sendMessage(m.key.remoteJid, { react: { text: "📸", key: m.key } });

      // Check if it's an image or video (usually V2 returns MP4)
      const isVideo = downloadUrl.includes(".mp4");
      
      await sock.sendMessage(m.key.remoteJid, {
        [isVideo ? "video" : "image"]: { url: downloadUrl },
        caption: caption
      }, { quoted: m });

    } catch (error) {
      console.error("Instagram V2 DL Error:", error.message);
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to download Instagram media. Ensure the link is valid and public.", edit: loadingMsg.key });
    }
  }
};
