const axios = require("axios");
const moment = require("moment-timezone");

module.exports = {
  name: "github",
  aliases: ["git", "gh", "repo", "sc", "script"],
  category: "developer",
  description: "Search for a GitHub user or repository.",
  async execute(sock, m, args) {
    let query = args[0];
    if (!query) {
      return sock.sendMessage(m.key.remoteJid, { 
        text: "🐙 *GitHub Search*\n\n*Usage:*\n• `.github <username>`\n• `.github <username>/<repo>`\n\n*Example:* `.github ZainMughal`" 
      }, { quoted: m });
    }

    try {
      await sock.sendMessage(m.key.remoteJid, { react: { text: "🔍", key: m.key } });

      let text = "";
      let imageUrl = "";

      if (query.includes("/")) {
        // Repository Search
        const { data } = await axios.get(`https://api.github.com/repos/${query}`);
        text = `*乂 GITHUB REPO 乂*\n\n`;
        text += `📛 *Name:* ${data.name}\n`;
        text += `⭐ *Stars:* ${data.stargazers_count.toLocaleString()}\n`;
        text += `🍴 *Forks:* ${data.forks_count.toLocaleString()}\n`;
        text += `👀 *Watchers:* ${data.watchers_count.toLocaleString()}\n`;
        text += `🕒 *Created:* ${moment(data.created_at).format("DD/MM/YY")}\n`;
        text += `🔄 *Updated:* ${moment(data.updated_at).format("DD/MM/YY")}\n`;
        text += `🔗 *URL:* ${data.html_url}`;
        imageUrl = data.owner.avatar_url;
      } else {
        // User Search
        const { data } = await axios.get(`https://api.github.com/users/${query}`);
        text = `*乂 GITHUB USER 乂*\n\n`;
        text += `👤 *Username:* ${data.login}\n`;
        text += `📛 *Name:* ${data.name || "N/A"}\n`;
        text += `📝 *Bio:* ${data.bio || "No bio provided."}\n`;
        text += `📦 *Public Repos:* ${data.public_repos}\n`;
        text += `👥 *Followers:* ${data.followers.toLocaleString()}\n`;
        text += `🕒 *Joined:* ${moment(data.created_at).format("DD/MM/YY")}\n`;
        text += `🔗 *Profile:* ${data.html_url}`;
        imageUrl = data.avatar_url;
      }

      await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });
      
      if (imageUrl) {
        await sock.sendMessage(m.key.remoteJid, { 
          image: { url: imageUrl }, 
          caption: text 
        }, { quoted: m });
      } else {
        await sock.sendMessage(m.key.remoteJid, { text: text }, { quoted: m });
      }

    } catch (error) {
      console.error("GitHub Command Error:", error.message);
      await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
      if (error.response?.status === 404) {
        await sock.sendMessage(m.key.remoteJid, { text: `❌ GitHub ${query.includes("/") ? "Repository" : "User"} *${query}* not found.` }, { quoted: m });
      } else {
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to fetch GitHub info." }, { quoted: m });
      }
    }
  }
};

