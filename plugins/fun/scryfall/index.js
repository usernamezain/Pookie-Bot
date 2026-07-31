const axios = require("axios");

module.exports = {
  name: "scryfall",
  aliases: [],
  category: "fun",
  description: "Search for Magic: The Gathering cards with multi-result support.",
  async execute(sock, m, args, config) {
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

    if (!query) {
      return sock.sendMessage(m.key.remoteJid, { 
        text: "🃏 *Magic: The Gathering Search*\n\n*Usage:*\n• `.scryfall <card_name>`\n• `.scryfall <count> <query>`\n\n*Example:* `.scryfall 2 dragon` (Sends 2 dragon cards)" 
      }, { quoted: m });
    }

    // --- Loading Animation Logic ---
    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🃏 *Summoning Cards...*" }, { quoted: m });
    const frames = [
      "✨ [■□□□□□□□□□] 10%",
      "✨ [■■■□□□□□□□] 30%",
      "✨ [■■■■■■□□□□] 60%",
      "✨ [■■■■■■■■■□] 90%",
      "🃏 *Cards Summoned!*"
    ];

    const animate = async () => {
      for (let i = 0; i < frames.length - 1; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        await sock.sendMessage(m.key.remoteJid, { text: frames[i], edit: loadingMsg.key });
      }
    };

    // Start animation in parallel
    animate();

    try {
      await sock.sendMessage(m.key.remoteJid, { react: { text: "🃏", key: m.key } });

      // Use search endpoint for multi-result support
      const { data } = await axios.get(`https://api.scryfall.com/cards/search`, {
        params: { q: query }
      });

      // Finish the animation
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });

      const results = data.data;
      const countToSend = Math.min(results.length, limit);
      let successCount = 0;

      for (let i = 0; i < countToSend; i++) {
        try {
          const card = results[i];
          const price = card.prices ? (card.prices.usd ? `$${card.prices.usd}` : (card.prices.eur ? `€${card.prices.eur}` : "N/A")) : "N/A";
          const imageUrl = card.image_uris ? card.image_uris.normal : (card.card_faces && card.card_faces[0].image_uris ? card.card_faces[0].image_uris.normal : null);

          let text = `*乂 MTG CARD ${i + 1}/${countToSend} 乂*\n\n`;
          text += `🃏 *Name:* ${card.name}\n`;
          text += `📝 *Type:* ${card.type_line}\n`;
          text += `💧 *Mana Cost:* ${card.mana_cost || "N/A"}\n`;
          text += `💰 *Price:* ${price}\n\n`;
          text += `📜 *Oracle Text:*\n_${card.oracle_text || "No text."}_\n\n`;
          text += `_Generated via ${config.BOT_NAME}_`;

          if (imageUrl) {
            await sock.sendMessage(m.key.remoteJid, {
              image: { url: imageUrl },
              caption: text
            }, { quoted: m });
          } else {
            await sock.sendMessage(m.key.remoteJid, { text: text }, { quoted: m });
          }
          successCount++;
        } catch (e) {
          console.error("Failed to send card info:", e.message);
        }
      }

      if (successCount > 0) {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });
      } else {
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to load card details." }, { quoted: m });
      }

    } catch (error) {
      console.error("Scryfall Search Error:", error.message);
      await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });

      if (error.response && error.response.status === 404) {
        await sock.sendMessage(m.key.remoteJid, { text: `❌ *No cards found:* We couldn't find any results for "${query}".` }, { quoted: m });
      } else {
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to fetch card data. Scryfall API might be down." }, { quoted: m });
      }
    }
  }
};
