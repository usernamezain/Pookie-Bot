const axios = require("axios");

module.exports = {
  name: "image",
  aliases: ["img", "googleimage"],
  category: "search",
  description: "Search for images on Google with a loading animation.",
  async execute(sock, m, args) {
    let limit = 1;
    let query = "";

    if (args[0] && !isNaN(args[0])) {
      limit = parseInt(args[0]);
      query = args.slice(1).join(" ");
    } else {
      query = args.join(" ");
    }

    if (limit > 4) limit = 4;
    if (limit < 1) limit = 1;

    const quotedText = m.message.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || 
                       m.message.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text;
    if (!query && quotedText) query = quotedText;

    if (!query) {
      return sock.sendMessage(m.key.remoteJid, { 
        text: "🖼️ *Image Search*\n\n*Usage:*\n• `.img <query>`\n• `.img <count> <query>`\n\n*Example:* `.img 2 cats` (Sends 2 images of cats)\n*Max limit: 4*" 
      }, { quoted: m });
    }

    // --- Loading Animation Logic ---
    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🔍 *Initializing Search...*" }, { quoted: m });
    const frames = [
      "⚡ [■□□□□□□□□□] 10%",
      "⚡ [■■■□□□□□□□] 30%",
      "⚡ [■■■■■■□□□□] 60%",
      "⚡ [■■■■■■■■■□] 90%",
      "✅ *Search Complete!*"
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
      await sock.sendMessage(m.key.remoteJid, { react: { text: "🔍", key: m.key } });

      const apikey = process.env.GIFTED_API_KEY || "gifted";
      const apiUrl = `https://api.giftedtech.co.ke/api/search/googleimage?apikey=${apikey}&query=${encodeURIComponent(query)}`;
      
      const { data } = await axios.get(apiUrl);

      // Finish the animation
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });

      if (!data?.success || !data.results || data.results.length === 0) {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
        return sock.sendMessage(m.key.remoteJid, { text: "❌ No images found for your query." }, { quoted: m });
      }

      const countToSend = Math.min(data.results.length, limit);
      let successCount = 0;

      for (let i = 0; i < countToSend; i++) {
        try {
          await sock.sendMessage(m.key.remoteJid, { 
            image: { url: data.results[i] }, 
            caption: `*乂 IMAGE RESULT ${i + 1}/${countToSend} 乂*\n\n🔍 *Query:* ${query}` 
          }, { quoted: m });
          successCount++;
        } catch (e) {
          console.error("Failed to send image:", e.message);
        }
      }

      if (successCount > 0) {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });
      } else {
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to load images. Try a different query." }, { quoted: m });
      }

    } catch (err) {
      console.error("Image search error:", err.message);
      await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });
      await sock.sendMessage(m.key.remoteJid, { text: "❌ An error occurred during image search." }, { quoted: m });
    }
  }
};

