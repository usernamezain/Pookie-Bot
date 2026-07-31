const axios = require("axios");

module.exports = {
  name: "sodeom",
  aliases: ["search", "find", "google", "sodesearch"],
  category: "search",
  description: "Search the web privately using Sodeom.",
  async execute(sock, m, args) {
    const query = args.join(" ");
    if (!query) {
      return sock.sendMessage(m.key.remoteJid, { 
        text: "🔍 *Sodeom Private Search*\n\n*Usage:*\n• `.search <query>`\n\n*Example:* `.search latest technology`" 
      }, { quoted: m });
    }

    // --- Loading Animation Logic ---
    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🔍 *Initializing Private Search...*" }, { quoted: m });
    const frames = [
      "📡 [■□□□□□□□□□] 10%",
      "📡 [■■■□□□□□□□] 30%",
      "📡 [■■■■■■□□□□] 60%",
      "📡 [■■■■■■■■■□] 90%",
      "✅ *Results Fetched!*"
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

      const { data } = await axios.get(`https://sodeom.com/api/search`, {
        params: { q: query, page: 1 },
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
      });

      // Finish the animation
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });

      let results = [];
      if (Array.isArray(data)) {
        results = data;
      } else if (data.results && Array.isArray(data.results)) {
        results = data.results;
      } else if (data.data && Array.isArray(data.data)) {
        results = data.data;
      }

      if (!results || results.length === 0) {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
        return sock.sendMessage(m.key.remoteJid, { text: `❌ No results found for "${query}".` }, { quoted: m });
      }

      // Limit to top 5
      const topResults = results.slice(0, 5);
      let text = `*乂 SODEOM SEARCH RESULTS 乂*\n\n🔍 *Query:* ${query}\n\n`;

      topResults.forEach((res, index) => {
        const title = res.title || res.header || "No Title";
        const link = res.url || res.link || "#";
        const desc = res.description || res.snippet || res.body || "";

        text += `*${index + 1}. ${title.toUpperCase()}*\n`;
        if (desc) text += `_${desc.slice(0, 150)}${desc.length > 150 ? "..." : ""}_\n`;
        text += `🔗 ${link}\n\n`;
      });

      text += `_Powered by Sodeom Private Search_`;

      await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: text }, { quoted: m });

    } catch (error) {
      console.error("Sodeom Command Error:", error.message);
      await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to fetch search results. The service might be temporarily unavailable." }, { quoted: m });
    }
  }
};
