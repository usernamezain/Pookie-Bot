const wiki = require("wikijs").default;

module.exports = {
  name: "wikipedia",
  aliases: ["wiki"],
  category: "search",
  description: "Search for information on Wikipedia.",
  async execute(sock, m, args) {
    let query = args.join(" ");
    const quotedText = m.message.extendedTextMessage?.contextInfo?.quotedMessage?.conversation || 
                       m.message.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text;

    if (!query && quotedText) query = quotedText;

    if (!query) {
      return sock.sendMessage(m.key.remoteJid, { 
        text: "📚 *Wikipedia Search*\n\n*Usage:* `.wiki <query>` or reply to a message with `.wiki`.\n*Example:* `.wiki Javascript`" 
      }, { quoted: m });
    }

    try {
      await sock.sendMessage(m.key.remoteJid, { react: { text: "🔍", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: `🔎 Searching Wikipedia for: *${query}*...` }, { quoted: m });
      
      const page = await wiki().page(query);
      const summary = await page.summary();
      const url = page.url();

      let response = `*📚 Wikipedia: ${query.toUpperCase()}*\n\n`;
      response += `${summary.substring(0, 2000)}`; 
      if (summary.length > 2000) response += "...";
      response += `\n\n🔗 *Full Article:* ${url}\n\nGenerated via Pookie Bot`;

      await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: response }, { quoted: m });
    } catch (err) {
      console.error("Wikipedia search error:", err.message);
      await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: "❌ *Page not found:* We couldn't find a Wikipedia entry for that topic." }, { quoted: m });
    }
  }
};
