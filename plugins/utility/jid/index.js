module.exports = {
  name: "jid",
  aliases: ["getjid", "id", "who"],
  category: "utility",
  description: "Get the JID (WhatsApp ID) of a user, group, or yourself.",

  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    const isGroup = from.endsWith("@g.us");
    const sender = isGroup ? m.key.participant : from;

    const lines = ["📋 *JID Information*", ""];

    // ── Replied user ─────────────────────────────────────────────────────────
    const ctx = m.message?.extendedTextMessage?.contextInfo;
    if (ctx?.participant) {
      lines.push(`💬 *Replied User JID:*`);
      lines.push(`\`${ctx.participant}\``);
      lines.push("");
    }

    // ── Sender ───────────────────────────────────────────────────────────────
    lines.push(`👤 *Your JID:*`);
    lines.push(`\`${sender}\``);
    lines.push("");

    // ── Group ─────────────────────────────────────────────────────────────────
    if (isGroup) {
      lines.push(`👥 *Group JID:*`);
      lines.push(`\`${from}\``);
      lines.push("");
    }

    // ── Bot ──────────────────────────────────────────────────────────────────
    lines.push(`🤖 *Bot JID:*`);
    lines.push(`\`${sock.user.id}\``);
    lines.push("");
    lines.push("_Copy a JID and use it with .mirror, .reminder etc._");

    await sock.sendMessage(from, { text: lines.join("\n") }, { quoted: m });
  }
};
