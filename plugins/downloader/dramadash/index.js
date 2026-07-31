const axios = require("axios");

module.exports = {
  name: "dramadash",
  aliases: ["drama", "dd"],
  category: "downloader",
  description: "Search and download dramas from DramaDash.",
  async execute(sock, m, args, config) {
    const query = args.join(" ");
    if (!query) {
      return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide a drama name to search or an ID to download.\n\n*Usage:*\n• Search: \`.drama love\`\n• Download: \`.drama dl <id>\`" }, { quoted: m });
    }

    const isDownload = args[0] === "dl" && args[1];
    const action = isDownload ? "download" : "search";
    const q = isDownload ? args[1] : query;

    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: `🎬 *DramaDash: ${action === "search" ? "Searching" : "Fetching Details"}...*` }, { quoted: m });
    
    try {
      const url = `https://api.giftedtech.co.ke/api/download/dramadash?apikey=${config.GIFTED_API_KEY}&action=${action}&${isDownload ? "id" : "q"}=${encodeURIComponent(q)}`;
      const { data } = await axios.get(url);
      
      if (data.status !== 200 || !data.result) throw new Error("API Error");

      if (action === "search") {
        const results = data.result.slice(0, 10);
        let text = `*乂 DRAMADASH SEARCH 乂*\n\n`;
        
        results.forEach((res) => {
          text += `🆔 *ID:* ${res.id}\n`;
          text += `🎬 *Name:* ${res.name}\n`;
          text += `🏷️ *Genres:* ${res.genres.join(", ")}\n`;
          text += `───────────────────\n`;
        });

        text += `\n_Use \`.drama dl <id>\` to download!_`;

        await sock.sendMessage(m.key.remoteJid, { text: "✅ *Search Complete!*", edit: loadingMsg.key });
        await sock.sendMessage(m.key.remoteJid, {
          image: { url: results[0].poster },
          caption: text
        }, { quoted: m });
      } else {
        // Download logic
        const res = data.result;
        await sock.sendMessage(m.key.remoteJid, { text: "✅ *Drama Details Found!* Sending video...", edit: loadingMsg.key });
        
        // Note: The API likely returns a download_url or similar in result for action=download
        const videoUrl = res.download_url || res.url || res.medias?.[0]?.url;

        if (!videoUrl) {
          return sock.sendMessage(m.key.remoteJid, { text: "❌ No download link found for this ID.", edit: loadingMsg.key });
        }

        await sock.sendMessage(m.key.remoteJid, {
          video: { url: videoUrl },
          caption: `✅ *Drama Downloaded*\n\n📌 *Title:* ${res.name || "Unknown"}\n\n_Downloaded via ${config.BOT_NAME}_`
        }, { quoted: m });
      }

    } catch (e) {
      console.error("DramaDash Error:", e.message);
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to process DramaDash request.", edit: loadingMsg.key });
    }
  }
};
