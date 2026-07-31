const axios = require("axios");

module.exports = {
  name: "groupinfo",
  aliases: ["ginfo", "gcinfo", "infogroup"],
  category: "group",
  description: "Display detailed information about a group (Current or via Link).",
  async execute(sock, m, args, config) {
    let groupMetadata;
    let inviteCode = "";

    // Check if input is a group link
    const linkRegex = /chat.whatsapp.com\/([0-9A-Za-z]{20,24})/i;
    const match = args[0]?.match(linkRegex);

    // --- Loading Animation Logic ---
    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🔍 *Fetching Group Metadata...*" }, { quoted: m });
    const frames = [
      "📡 [■□□□□□□□□□] 10%",
      "📡 [■■■□□□□□□□] 30%",
      "📡 [■■■■■■□□□□] 60%",
      "📡 [■■■■■■■■■□] 90%",
      "✅ *Metadata Retrieved!*"
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
      if (match) {
        // Fetch via Invite Link
        inviteCode = match[1];
        groupMetadata = await sock.groupGetInviteInfo(inviteCode);
      } else {
        // Fetch Current Group
        if (!m.key.remoteJid.endsWith("@g.us")) {
          await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });
          return sock.sendMessage(m.key.remoteJid, { text: "❌ *Error:* This command must be used in a group or with a group link.\n\n*Example:* `.ginfo https://chat.whatsapp.com/...`" }, { quoted: m });
        }
        groupMetadata = await sock.groupMetadata(m.key.remoteJid);
      }

      // Finish the animation
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });

      let pp;
      try {
        pp = await sock.profilePictureUrl(groupMetadata.id, "image");
      } catch {
        pp = "https://i.imgur.com/2wzGhpF.jpeg";
      }

      const participants = groupMetadata.participants || [];
      const admins = participants.filter(p => p.admin).map(p => `@${p.id.split("@")[0]}`);
      const owner = groupMetadata.owner || participants.find(p => p.admin === "superadmin")?.id || "Unknown";

      let text = `*乂 GROUP INFORMATION 乂*\n\n`;
      text += `📝 *Name:* ${groupMetadata.subject}\n`;
      text += `🆔 *ID:* ${groupMetadata.id}\n`;
      text += `👑 *Owner:* @${owner.split("@")[0]}\n`;
      text += `👥 *Members:* ${participants.length}\n`;
      text += `👮 *Admins:* ${admins.length}\n`;
      text += `📅 *Created:* ${groupMetadata.creation ? new Date(groupMetadata.creation * 1000).toLocaleString() : "Unknown"}\n\n`;
      
      text += `📌 *Description:*\n_${groupMetadata.desc?.toString() || "No description provided."}_\n\n`;
      
      if (admins.length > 0) {
        text += `🛡️ *Admin List:*\n${admins.join(", ")}\n\n`;
      }
      
      text += `_Generated via ${config.BOT_NAME}_`;

      await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, {
        image: { url: pp },
        caption: text,
        mentions: [...participants.filter(p => p.admin).map(p => p.id), owner]
      }, { quoted: m });

    } catch (error) {
      console.error("Group Info Error:", error.message);
      await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to fetch group info. If using a link, make sure it is valid." }, { quoted: m });
    }
  }
};
