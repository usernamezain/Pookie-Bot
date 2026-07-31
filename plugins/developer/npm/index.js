const axios = require("axios");

module.exports = {
  name: "npm",
  aliases: ["package"],
  category: "developer",
  description: "Search for a package on the NPM registry.",
  async execute(sock, m, args) {
    const packageName = args[0];
    if (!packageName) {
      return sock.sendMessage(m.key.remoteJid, { 
        text: "📦 *NPM Package Search*\n\n*Usage:*\n• `.npm <package_name>`\n\n*Example:* `.npm axios`" 
      }, { quoted: m });
    }

    try {
      await sock.sendMessage(m.key.remoteJid, { react: { text: "🔍", key: m.key } });

      const { data } = await axios.get(`https://registry.npmjs.org/${packageName}`);
      
      // Get the latest version
      const latestVersion = data["dist-tags"].latest;
      const versionInfo = data.versions[latestVersion];

      let text = `📦 *NPM: ${data.name}*\n\n`;
      text += `📝 *Description:* ${data.description || "No description provided."}\n`;
      text += `🏷️ *Latest Version:* ${latestVersion}\n`;
      text += `👤 *Author:* ${data.author?.name || "Unknown"}\n`;
      text += `⚖️ *License:* ${data.license || "None"}\n`;
      text += `🔗 *Homepage:* ${data.homepage || "N/A"}\n`;
      text += `📂 *Main File:* ${versionInfo.main || "N/A"}\n\n`;
      
      text += `*Installation:*\n\`npm install ${data.name}\``;

      await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: text }, { quoted: m });

    } catch (error) {
      console.error("NPM Command Error:", error.message);
      await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
      if (error.response?.status === 404) {
        await sock.sendMessage(m.key.remoteJid, { text: `❌ Package *${packageName}* not found.` }, { quoted: m });
      } else {
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to fetch package info." }, { quoted: m });
      }
    }
  }
};
