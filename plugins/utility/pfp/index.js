module.exports = {
  name: "pfp",
  aliases: ["dp", "profilepic", "getpfp", "getdp"],
  category: "utility",
  description: "Get the profile picture of a user or group.",

  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    const isGroup = from.endsWith("@g.us");

    // Determine target JID
    let targetJid = null;
    let label = "";

    // Priority: replied user > arg JID > group if in group > self
    const ctx = m.message?.extendedTextMessage?.contextInfo;
    if (ctx?.participant) {
      targetJid = ctx.participant;
      label = `User (replied)`;
    } else if (args[0] && args[0].includes("@")) {
      targetJid = args[0];
      label = `JID: ${args[0]}`;
    } else if (isGroup && (!args[0] || args[0] === "group")) {
      targetJid = from;
      label = "This Group";
    } else {
      targetJid = isGroup ? m.key.participant : from;
      label = "You";
    }

    try {
      await sock.sendMessage(from, { react: { text: "🔍", key: m.key } });

      // Try high-res first, fall back to preview
      let ppUrl;
      try {
        ppUrl = await sock.profilePictureUrl(targetJid, "image");
      } catch {
        try {
          ppUrl = await sock.profilePictureUrl(targetJid, "preview");
        } catch {
          ppUrl = null;
        }
      }

      if (!ppUrl) {
        await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
        return sock.sendMessage(from, {
          text: `❌ No profile picture found for *${label}*\n\n_They may have set privacy to 'Nobody'._`
        }, { quoted: m });
      }

      await sock.sendMessage(from, {
        image: { url: ppUrl },
        caption: `🖼️ *Profile Picture*\n👤 *${label}*\n\n_JID:_ \`${targetJid}\``
      }, { quoted: m });

      await sock.sendMessage(from, { react: { text: "✅", key: m.key } });

    } catch (err) {
      console.error("[pfp] Error:", err.message);
      await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
      await sock.sendMessage(from, {
        text: `❌ Failed to fetch profile picture.\n_${err.message}_`
      }, { quoted: m });
    }
  }
};
