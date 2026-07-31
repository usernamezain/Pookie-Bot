const tracker = require("../../../lib/tracker");

module.exports = {
  name: "seen",
  aliases: ["whoseen", "readby", "seenby"],
  category: "owner",
  description: "Check who has seen (read) a specific message.",

  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    if (!m.key.fromMe) return sock.sendMessage(from, { text: "❌ Owner only." }, { quoted: m });

    // ── Get message ID from reply or arg ──────────────────────────────────────
    const ctx = m.message?.extendedTextMessage?.contextInfo;
    const msgId = args[0] || ctx?.stanzaId;

    if (!msgId) {
      return sock.sendMessage(from, {
        text: [
          "👁️ *Seen Checker*", "",
          "*Usage (reply to a message):*",
          "  Reply to any message + type `.seen`",
          "",
          "*Usage (by message ID):*",
          "  `.seen <message_id>`",
          "",
          "Shows everyone who has *read* that message.",
          "",
          "⚠️ _Only works for messages sent while the bot was running_",
          "⚠️ _Only shows people who have read receipts enabled_"
        ].join("\n")
      }, { quoted: m });
    }

    await sock.sendMessage(from, { react: { text: "🔍", key: m.key } });

    const receipts = tracker.getSeenFor(msgId);

    if (!receipts.length) {
      await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
      return sock.sendMessage(from, {
        text: [
          "👁️ *Seen Data: Not Found*", "",
          `📋 *Message ID:* \`${msgId}\``, "",
          "Possible reasons:",
          "• Message was sent before bot started tracking",
          "• No one has read it yet",
          "• Readers have read receipts disabled",
          "",
          "💡 Tip: For group messages, read receipts only work if members allow it."
        ].join("\n")
      }, { quoted: m });
    }

    const lines = [
      `👁️ *Seen By — ${receipts.length} ${receipts.length === 1 ? "person" : "people"}*`,
      `📋 Msg ID: \`${msgId}\``, ""
    ];
    receipts.forEach((r, i) => {
      const readAt = new Date(r.readAt);
      lines.push(`${i + 1}. 👤 \`${r.jid.split("@")[0]}\``);
      lines.push(`   🕐 Read at: ${readAt.toLocaleTimeString()} ${readAt.toLocaleDateString()}`);
      lines.push("");
    });

    await sock.sendMessage(from, { react: { text: "✅", key: m.key } });
    return sock.sendMessage(from, { text: lines.join("\n") }, { quoted: m });
  }
};
