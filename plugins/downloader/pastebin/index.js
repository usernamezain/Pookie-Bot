const axios = require("axios");

module.exports = {
  name: "pastebin",
  aliases: ["paste", "raw"],
  category: "downloader",
  description: "Get raw text from a Pastebin link.",
  async execute(sock, m, args, config) {
    const url = args[0];
    if (!url || !url.includes("pastebin.com")) {
      return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide a valid Pastebin URL." }, { quoted: m });
    }

    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "📑 *Fetching Pastebin Content...*" }, { quoted: m });
    
    try {
      const { data } = await axios.get(`https://api.giftedtech.co.ke/api/download/pastebin?apikey=${config.GIFTED_API_KEY}&url=${encodeURIComponent(url)}`);
      
      if (data.status !== 200 || !data.result) throw new Error("API Error");

      const text = data.result;
      
      await sock.sendMessage(m.key.remoteJid, { text: "✅ *Content Fetched!*", edit: loadingMsg.key });

      // If text is very long, send as a document. Otherwise, send as message.
      if (text.length > 4000) {
        await sock.sendMessage(m.key.remoteJid, {
          document: Buffer.from(text),
          fileName: "pastebin_content.txt",
          mimetype: "text/plain",
          caption: `📑 *Pastebin Content*\n\n_Downloaded via ${config.BOT_NAME}_`
        }, { quoted: m });
      } else {
        await sock.sendMessage(m.key.remoteJid, {
          text: `📑 *乂 PASTEBIN CONTENT 乂*\n\n\`\`\`${text}\`\`\`\n\n_Downloaded via ${config.BOT_NAME}_`
        }, { quoted: m });
      }

    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to fetch Pastebin content.", edit: loadingMsg.key });
    }
  }
};
