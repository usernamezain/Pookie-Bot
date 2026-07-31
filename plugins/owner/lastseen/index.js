const tracker = require("../../../lib/tracker");

module.exports = {
  name: "lastseen",
  aliases: ["lastactive", "lastonline", "ls"],
  category: "owner",
  description: "Check when a contact was last seen online.",

  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    if (!m.key.fromMe) return sock.sendMessage(from, { text: "❌ Owner only." }, { quoted: m });

    // Get JID from arg, reply, or current chat
    const ctx = m.message?.extendedTextMessage?.contextInfo;
    let jid = args[0] || ctx?.participant || (from.endsWith("@g.us") ? null : from);

    if (!jid) return sock.sendMessage(from, {
      text: [
        "👁️ *Last Seen Checker*", "",
        "Usage:",
        "  `.lastseen <jid>`           — check any JID",
        "  `.lastseen` _(reply to msg)_ — check that person",
        "",
        "Example: `.lastseen 923001234567@s.whatsapp.net`",
        "",
        "_Use `.jid` to find someone's JID_"
      ].join("\n")
    }, { quoted: m });

    await sock.sendMessage(from, { react: { text: "🔍", key: m.key } });

    // Subscribe first to get fresh data
    try {
      await sock.presenceSubscribe(jid);
      await new Promise(r => setTimeout(r, 2000)); // wait for presence update
    } catch {}

    const last = tracker.getLastKnown(jid);
    const allLog = tracker.getPresenceLog(jid);

    if (!last && !allLog.length) {
      await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
      return sock.sendMessage(from, {
        text: [
          `👁️ *Last Seen: Unknown*`, "",
          `👤 JID: \`${jid}\``, "",
          "❌ No presence data available.",
          "",
          "This happens when:",
          "• They set Last Seen to *Nobody*",
          "• They've never been online while bot was running",
          "",
          "💡 Use `.track start " + jid + "` to start logging them.",
          "💡 Use `.onlineping start " + jid + "` for instant alerts."
        ].join("\n")
      }, { quoted: m });
    }

    const onlineEntries = allLog.filter(e => e.status === "available");
    const lastOnline = onlineEntries[onlineEntries.length - 1];
    const now = Date.now();
    const lastTs = lastOnline ? new Date(lastOnline.ts).getTime() : null;
    const agoMs = lastTs ? now - lastTs : null;

    function msToAgo(ms) {
      if (ms < 60000) return "just now";
      if (ms < 3600000) return `${Math.floor(ms / 60000)} min ago`;
      if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
      return `${Math.floor(ms / 86400000)}d ago`;
    }

    await sock.sendMessage(from, { react: { text: "✅", key: m.key } });
    return sock.sendMessage(from, {
      text: [
        "👁️ *Last Seen Report*", "",
        `👤 *Contact:* \`${jid}\``,
        `🔘 *Current status:* ${last?.status === "available" ? "🟢 ONLINE NOW" : "🔴 Offline"}`,
        "",
        lastOnline
          ? `🕐 *Last online:* ${new Date(lastOnline.ts).toLocaleTimeString()} ${new Date(lastOnline.ts).toLocaleDateString()}\n⏱️ *That was:* ${msToAgo(agoMs)}`
          : "🕐 *Last online:* Not recorded yet",
        "",
        `📊 *Total logged sessions:* ${onlineEntries.length}`,
        "",
        `💡 Use \`.track start ${jid}\` for continuous monitoring`
      ].join("\n")
    }, { quoted: m });
  }
};
