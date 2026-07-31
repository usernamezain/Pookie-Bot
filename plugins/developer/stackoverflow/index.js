const axios = require("axios");

module.exports = {
  name: "stackoverflow",
  aliases: ["sof", "stack"],
  category: "developer",
  description: "Search for coding solutions on StackOverflow.",
  async execute(sock, m, args) {
    const query = args.join(" ");
    if (!query) {
      return sock.sendMessage(m.key.remoteJid, { 
        text: "👨‍💻 *StackOverflow Search*\n\n*Usage:*\n• `.sof <query>`\n\n*Example:* `.sof javascript array filter`" 
      }, { quoted: m });
    }

    try {
      await sock.sendMessage(m.key.remoteJid, { react: { text: "⏳", key: m.key } });

      const { data } = await axios.get(`https://api.stackexchange.com/2.3/search/advanced`, {
        params: {
          order: "desc",
          sort: "relevance",
          q: query,
          site: "stackoverflow",
          pagesize: 3
        }
      });

      if (!data.items || data.items.length === 0) {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
        return sock.sendMessage(m.key.remoteJid, { text: `❌ No results found for "${query}".` }, { quoted: m });
      }

      let text = `👨‍💻 *StackOverflow Results: "${query}"*\n\n`;

      data.items.forEach((item, index) => {
        // Decode HTML entities in title if necessary (StackOverflow API titles are often entity-encoded)
        const title = item.title.replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&amp;/g, "&");
        text += `*${index + 1}. ${title}*\n`;
        text += `👀 Views: ${item.view_count} | ✅ Answered: ${item.is_answered ? "Yes" : "No"}\n`;
        text += `🔗 ${item.link}\n\n`;
      });

      await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: text.trim() }, { quoted: m });

    } catch (error) {
      console.error("StackOverflow Command Error:", error.message);
      await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to search StackOverflow." }, { quoted: m });
    }
  }
};
