const axios = require("axios");

module.exports = {
  name: "microlink",
  aliases: ["mlink", "ssweb", "webinfo"],
  category: "utility",
  description: "Get metadata and a screenshot of any website.",
  async execute(sock, m, args, config) {
    const url = args[0];

    if (!url) {
      return sock.sendMessage(m.key.remoteJid, { 
        text: "🔗 *Microlink Web Tool*\n\n*Usage:* `.mlink <url>`\n*Example:* `.mlink https://google.com`" 
      }, { quoted: m });
    }

    // Validate URL
    if (!url.startsWith("http")) {
      return sock.sendMessage(m.key.remoteJid, { text: "❌ *Invalid URL:* Please include http:// or https://" }, { quoted: m });
    }

    // --- Loading Animation Logic ---
    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🔍 *Analyzing Website...*" }, { quoted: m });
    const frames = [
      "🌐 [■□□□□□□□□□] 10%",
      "🌐 [■■■□□□□□□□] 30%",
      "🌐 [■■■■■■□□□□] 60%",
      "🌐 [■■■■■■■■■□] 90%",
      "✅ *Website Captured!*"
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
      await sock.sendMessage(m.key.remoteJid, { react: { text: "🌐", key: m.key } });

      const apiUrl = `https://api.microlink.io/?url=${encodeURIComponent(url)}&screenshot=true&meta=true`;
      const { data } = await axios.get(apiUrl);

      // Finish the animation
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });

      if (data.status === "fail") {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
        return sock.sendMessage(m.key.remoteJid, { text: `❌ *Failed to process URL:* ${data.message || "Unknown error"}` }, { quoted: m });
      }

      const { title, description, image, publisher, date } = data.data;
      const screenshotUrl = data.data.screenshot ? data.data.screenshot.url : null;

      let text = `*乂 WEB PREVIEW 乂*\n\n`;
      text += `🌐 *Title:* ${title || "No Title"}\n`;
      if (description) text += `📝 *Description:* ${description.slice(0, 200)}...\n`;
      if (publisher) text += `🏢 *Publisher:* ${publisher}\n`;
      if (date) text += `📅 *Date:* ${new Date(date).toLocaleDateString()}\n\n`;
      text += `🔗 *Source:* ${url}\n\n`;
      text += `_Captured via ${config.BOT_NAME}_`;

      const mediaUrl = screenshotUrl || (image ? image.url : null);

      await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });

      if (mediaUrl) {
        await sock.sendMessage(m.key.remoteJid, {
          image: { url: mediaUrl },
          caption: text
        }, { quoted: m });
      } else {
        await sock.sendMessage(m.key.remoteJid, { text: text }, { quoted: m });
      }

    } catch (error) {
      console.error("Microlink Error:", error.message);
      await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to fetch website data. The site might be blocking previews." }, { quoted: m });
    }
  }
};
