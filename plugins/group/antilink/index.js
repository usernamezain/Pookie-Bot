const fs = require("fs-extra");
const path = require("path");

const antilinkPath = path.join(__dirname, "..", "..", "..", "antilink.json");

module.exports = {
  name: "antilink",
  aliases: ["linkguard"],
  category: "admin",
  description: "Toggle Anti-Link protection for the group.",
  async execute(sock, m, args) {
    if (!m.key.remoteJid.endsWith("@g.us")) {
      return sock.sendMessage(m.key.remoteJid, { text: "❌ This command only works in groups." }, { quoted: m });
    }

    const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
    const userAdmin = groupMetadata.participants.find(p => p.id === m.key.participant || p.id === m.participant)?.admin;

    if (!userAdmin) {
      return sock.sendMessage(m.key.remoteJid, { text: "❌ *Access Denied:* Only group admins can use this command." }, { quoted: m });
    }

    const action = args[0]?.toLowerCase();
    if (!["on", "off"].includes(action)) {
      return sock.sendMessage(m.key.remoteJid, { text: "🛡️ *Anti-Link Configuration*\n\nUsage:\n.antilink on  -> Enable Protection\n.antilink off -> Disable Protection" }, { quoted: m });
    }

    try {
      const data = await fs.readJson(antilinkPath).catch(() => ({}));
      if (!data.groups) data.groups = {};

      if (action === "on") {
        data.groups[m.key.remoteJid] = true;
        await fs.writeJson(antilinkPath, data, { spaces: 4 });
        await sock.sendMessage(m.key.remoteJid, { text: "✅ *Anti-Link Enabled:* All links (except from admins) will be blocked, and offenders will be warned/kicked." }, { quoted: m });
      } else {
        delete data.groups[m.key.remoteJid];
        // Also clear warnings for this group to save space
        if (data.warnings && data.warnings[m.key.remoteJid]) delete data.warnings[m.key.remoteJid];
        
        await fs.writeJson(antilinkPath, data, { spaces: 4 });
        await sock.sendMessage(m.key.remoteJid, { text: "❌ *Anti-Link Disabled:* Link protection is now off." }, { quoted: m });
      }
    } catch (err) {
      console.error("Antilink Toggle Error:", err.message);
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to update Anti-Link settings." }, { quoted: m });
    }
  }
};
