const fs = require("fs-extra");
const path = require("path");

const settingsPath = path.join(__dirname, "..", "..", "..", "settings.json");

module.exports = {
  name: "open",
  aliases: ["public", "mode"],
  category: "owner",
  description: "Toggle between Public (true) and Self (false) mode.",
  async execute(sock, m, args) {
    const fromMe = m.key.fromMe;
    
    // Simple owner check: Only the bot user (fromMe) can toggle this
    if (!fromMe) {
      return sock.sendMessage(m.key.remoteJid, { text: "❌ *Access Denied:* This command is for the Bot Owner only." }, { quoted: m });
    }

    const action = args[0]?.toLowerCase();
    if (action !== "true" && action !== "false") {
      return sock.sendMessage(m.key.remoteJid, { text: "🤖 *Bot Mode Configuration*\n\nUsage:\n.open true  -> Public Mode (Responds to everyone)\n.open false -> Self Mode (Responds to Owner only)" }, { quoted: m });
    }

    try {
      const settings = await fs.readJson(settingsPath).catch(() => ({}));
      settings.public_mode = action === "true";
      
      await fs.writeJson(settingsPath, settings, { spaces: 4 });
      
      const status = settings.public_mode ? "PUBLIC (Everyone)" : "SELF (Owner Only)";
      await sock.sendMessage(m.key.remoteJid, { text: `✅ *Mode Updated:* The bot is now in *${status}* mode.` }, { quoted: m });
    } catch (err) {
      console.error("Mode Toggle Error:", err.message);
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to update bot mode." }, { quoted: m });
    }
  }
};
