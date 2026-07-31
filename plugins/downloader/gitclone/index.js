module.exports = {
  name: "gitclone",
  aliases: ["clone", "gitdown"],
  category: "downloader",
  description: "Download a GitHub repository as a ZIP file.",
  async execute(sock, m, args, config) {
    let url = args[0];
    if (!url) {
      return sock.sendMessage(m.key.remoteJid, { 
        text: `📥 *GitHub Downloader*\n\n*Usage:* \`.clone <github_url>\`\n*Example:* \`.clone https://github.com/ZainMughal/Pookie-Bot\`\n\nDownloaded via ${config.BOT_NAME}` 
      }, { quoted: m });
    }

    // Extract username/repo
    const regex = /(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i;
    const match = url.match(regex);

    if (!match) {
      return sock.sendMessage(m.key.remoteJid, { text: "❌ *Invalid GitHub URL.* Please provide a valid repository link." }, { quoted: m });
    }

    const [_, user, repo] = match;
    const repoName = repo.replace(".git", "").split("?")[0]; // Clean up repo name
    
    // Most repos use 'main' or 'master'. We'll try 'main' first.
    // Note: GitHub's default is now 'main'.
    const zipUrl = `https://github.com/${user}/${repoName}/archive/refs/heads/main.zip`;

    try {
      await sock.sendMessage(m.key.remoteJid, { react: { text: "⏳", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: `📦 Fetching ZIP archive for *${repoName}*...` }, { quoted: m });

      await sock.sendMessage(m.key.remoteJid, {
        document: { url: zipUrl },
        fileName: `${repoName}.zip`,
        mimetype: "application/zip",
        caption: `✅ *Repository:* ${user}/${repoName}\n\nDownloaded via ${config.BOT_NAME}`
      }, { quoted: m });

      await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });
    } catch (e) {
      // If 'main' fails, it might be 'master' or a private repo
      try {
        const fallbackUrl = `https://github.com/${user}/${repoName}/archive/refs/heads/master.zip`;
        await sock.sendMessage(m.key.remoteJid, {
          document: { url: fallbackUrl },
          fileName: `${repoName}.zip`,
          mimetype: "application/zip",
          caption: `✅ *Repository:* ${user}/${repoName} (master branch)\n\nDownloaded via ${config.BOT_NAME}`
        }, { quoted: m });
        await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });
      } catch (err) {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
        await sock.sendMessage(m.key.remoteJid, { text: "❌ *Download Failed:* The repository might be private, or neither 'main' nor 'master' branches exist." }, { quoted: m });
      }
    }
  }
};
