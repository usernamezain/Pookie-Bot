const axios = require("axios");
const moment = require("moment-timezone");

module.exports = {
  name: "githubprofile",
  aliases: ["ghprofile", "ghstalk", "stalkgithub"],
  category: "stalk",
  description: "Get detailed information about a GitHub user profile.",
  async execute(sock, m, args) {
    const username = args[0];
    if (!username) {
      return sock.sendMessage(m.key.remoteJid, { 
        text: "🐙 *GitHub Stalker*\n\n*Usage:* `.githubprofile <username>`\n*Example:* `.githubprofile ZainMughal`" 
      }, { quoted: m });
    }

    try {
      await sock.sendMessage(m.key.remoteJid, { react: { text: "🔍", key: m.key } });

      const apiUrl = `https://discardapi.onrender.com/api/stalk/github?apikey=${process.env.GURU_API_KEY || "guru"}&url=${username}`;
      const { data } = await axios.get(apiUrl, {
        timeout: 45000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        }
      });

      if (!data?.result) {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
        return sock.sendMessage(m.key.remoteJid, { text: "❌ GitHub user not found." }, { quoted: m });
      }

      const result = data.result;

      const caption = `*乂 GITHUB STALK 乂*\n\n` +
        `👤 *Name:* ${result.nickname || "N/A"}\n` +
        `🆔 *Username:* ${result.username || "N/A"}\n` +
        `🏢 *Company:* ${result.company || "N/A"}\n` +
        `📍 *Location:* ${result.location || "N/A"}\n` +
        `💬 *Bio:* ${result.bio || "N/A"}\n` +
        `📦 *Public Repos:* ${result.public_repo || 0}\n` +
        `📜 *Public Gists:* ${result.public_gists || 0}\n` +
        `👥 *Followers:* ${result.followers || 0}\n` +
        `➡ *Following:* ${result.following || 0}\n` +
        `📅 *Created:* ${moment(result.created_at).format("DD/MM/YY")}\n` +
        `🕒 *Updated:* ${moment(result.updated_at).format("DD/MM/YY")}\n` +
        `🔗 *URL:* ${result.url || "N/A"}`;

      await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { 
        image: { url: result.profile_pic }, 
        caption: caption 
      }, { quoted: m });

    } catch (err) {
      console.error("GitHub Stalk Error:", err.message);
      await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to fetch GitHub profile. The service might be down." }, { quoted: m });
    }
  }
};
