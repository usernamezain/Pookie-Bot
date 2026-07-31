const tracker = require("../../../lib/tracker");

module.exports = {
  name: "onlineping",
  aliases: ["pingonline", "alertonline", "oping"],
  category: "owner",
  description: "Get an instant alert the moment a contact comes online.",

  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    if (!m.key.fromMe) return sock.sendMessage(from, { text: "❌ Owner only." }, { quoted: m });

    const sub = args[0]?.toLowerCase();

    // ── .onlineping start <jid> ───────────────────────────────────────────────
    if (sub === "start" || sub === "add" || sub === "on") {
      const jid = args[1];
      if (!jid) return sock.sendMessage(from, {
        text: [
          "🔔 *OnlinePing Setup*", "",
          "Usage: `.onlineping start <jid>`",
          "Example: `.onlineping start 923001234567@s.whatsapp.net`",
          "",
          "_Use `.jid` to find the JID of any contact_"
        ].join("\n")
      }, { quoted: m });

      await sock.sendMessage(from, { react: { text: "⏳", key: m.key } });
      tracker.addPing(jid, from);
      await sock.presenceSubscribe(jid);
      await sock.sendMessage(from, { react: { text: "✅", key: m.key } });

      return sock.sendMessage(from, {
        text: [
          "🔔 *OnlinePing Activated!*", "",
          `👤 *Watching:* \`${jid}\``,
          `📤 *Alerts to:* This chat`,
          "",
          "You'll get a message the *instant* they come online.",
          "_(5 min cooldown between pings to prevent spam)_",
          "",
          "`.onlineping stop <jid>` — stop",
          "`.onlineping list`       — all active pings",
          "",
          "⚠️ _Works only if their privacy allows presence visibility_"
        ].join("\n")
      }, { quoted: m });
    }

    // ── .onlineping stop <jid> ────────────────────────────────────────────────
    if (sub === "stop" || sub === "off" || sub === "remove") {
      const jid = args[1];
      if (!jid) return sock.sendMessage(from, { text: "Usage: `.onlineping stop <jid>`" }, { quoted: m });
      tracker.removePing(jid);
      return sock.sendMessage(from, { text: `✅ *OnlinePing stopped for:* \`${jid}\`` }, { quoted: m });
    }

    // ── .onlineping list ──────────────────────────────────────────────────────
    if (sub === "list" || sub === "ls") {
      const pings = tracker.getPings();
      const entries = Object.entries(pings);
      if (!entries.length) return sock.sendMessage(from, {
        text: "🔔 *No active OnlinePings.*\nUse `.onlineping start <jid>`"
      }, { quoted: m });

      const lines = ["🔔 *Active OnlinePings:*", ""];
      entries.forEach(([jid, info], i) => {
        lines.push(`${i + 1}. \`${jid}\``);
        lines.push(`   📤 Reports to: \`${info.reportTo}\``);
        if (info.lastPinged) lines.push(`   🕐 Last pinged: ${new Date(info.lastPinged).toLocaleTimeString()}`);
        else lines.push(`   🕐 Not pinged yet`);
        lines.push("");
      });
      lines.push("`.onlineping stop <jid>` — stop one");
      return sock.sendMessage(from, { text: lines.join("\n") }, { quoted: m });
    }

    // ── .onlineping clear ─────────────────────────────────────────────────────
    if (sub === "clear" || sub === "clearall") {
      const pings = tracker.getPings();
      Object.keys(pings).forEach(j => tracker.removePing(j));
      return sock.sendMessage(from, { text: "🗑️ *All OnlinePings cleared.*" }, { quoted: m });
    }

    // ── Help ──────────────────────────────────────────────────────────────────
    return sock.sendMessage(from, {
      text: [
        "🔔 *OnlinePing — Commands*", "",
        "`.onlineping start <jid>` — watch a contact",
        "`.onlineping stop <jid>`  — stop watching",
        "`.onlineping list`        — all active pings",
        "`.onlineping clear`       — stop all",
        "",
        "You get an *instant WhatsApp message* when they come online.",
        "5 min cooldown between alerts."
      ].join("\n")
    }, { quoted: m });
  }
};
