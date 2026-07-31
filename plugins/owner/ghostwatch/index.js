const tracker = require("../../../lib/tracker");

module.exports = {
  name: "ghostwatch",
  aliases: ["ghost", "ghostcheck", "readnoreply"],
  category: "owner",
  description: "Detect contacts who read your messages but never replied.",

  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    if (!m.key.fromMe) return sock.sendMessage(from, { text: "❌ Owner only." }, { quoted: m });

    const sub = args[0]?.toLowerCase();

    // ── .ghostwatch on ────────────────────────────────────────────────────────
    if (sub === "on" || sub === "start") {
      tracker.setGhostEnabled(true);
      return sock.sendMessage(from, {
        text: [
          "👻 *GhostWatch Activated!*", "",
          "I'll now track:",
          "✅ Every message you send",
          "✅ When they READ it (blue ticks)",
          "✅ Whether they replied within 30 min",
          "",
          "`.ghostwatch report`        — see who ghosted you",
          "`.ghostwatch report 60`     — with 60min threshold",
          "`.ghostwatch clear`         — reset all data",
          "`.ghostwatch off`           — disable",
          "",
          "⚠️ _Only works when recipient has READ RECEIPTS enabled (blue ticks on)_"
        ].join("\n")
      }, { quoted: m });
    }

    // ── .ghostwatch off ───────────────────────────────────────────────────────
    if (sub === "off" || sub === "stop") {
      tracker.setGhostEnabled(false);
      return sock.sendMessage(from, { text: "👻 *GhostWatch disabled.*" }, { quoted: m });
    }

    // ── .ghostwatch report [minutes] ──────────────────────────────────────────
    if (sub === "report" || sub === "check" || sub === "list") {
      const mins = parseInt(args[1]) || 30;
      const ghosts = tracker.getGhosts(mins);

      if (!ghosts.length) {
        return sock.sendMessage(from, {
          text: [
            `👻 *GhostWatch — No Ghosts Found!*`, "",
            `_(Checking messages read but unreplied after ${mins} min)_`,
            "",
            "Either everyone replied, or read receipts are disabled.",
            "",
            "`.ghostwatch report 60` — try with 60min threshold",
            "`.ghostwatch report 5`  — try with 5min threshold"
          ].join("\n")
        }, { quoted: m });
      }

      const lines = [`👻 *GhostWatch Report* _(>${mins}min threshold)_`, "", `Found *${ghosts.length}* ghost(s):`, ""];
      ghosts.forEach((g, i) => {
        const readAt = new Date(g.readAt);
        const sentAt = new Date(g.sentAt);
        const waitMin = Math.round((readAt - sentAt) / 60000);
        lines.push(`${i + 1}. 👤 *${g.to.split("@")[0]}*`);
        lines.push(`   📅 Sent: ${sentAt.toLocaleTimeString()} ${sentAt.toLocaleDateString()}`);
        lines.push(`   👁️ Read: ${readAt.toLocaleTimeString()} (${waitMin}m later)`);
        if (g.text) lines.push(`   💬 "${g.text.slice(0, 60)}${g.text.length > 60 ? "..." : ""}"`);
        lines.push("");
      });
      return sock.sendMessage(from, { text: lines.join("\n") }, { quoted: m });
    }

    // ── .ghostwatch clear ─────────────────────────────────────────────────────
    if (sub === "clear") {
      tracker.clearGhosts();
      return sock.sendMessage(from, { text: "🗑️ *GhostWatch data cleared.*" }, { quoted: m });
    }

    // ── .ghostwatch status ────────────────────────────────────────────────────
    if (sub === "status") {
      const enabled = tracker.ghostEnabled();
      const ghosts = tracker.getGhosts(30);
      return sock.sendMessage(from, {
        text: [
          `👻 *GhostWatch Status*`, "",
          `🔘 *Active:* ${enabled ? "✅ YES" : "❌ NO"}`,
          `👻 *Pending ghosts (30min):* ${ghosts.length}`,
          "",
          "`.ghostwatch on`      — enable",
          "`.ghostwatch report`  — see ghosts",
          "`.ghostwatch clear`   — reset data"
        ].join("\n")
      }, { quoted: m });
    }

    // ── Help ──────────────────────────────────────────────────────────────────
    return sock.sendMessage(from, {
      text: [
        "👻 *GhostWatch — Commands*", "",
        "`.ghostwatch on`             — enable tracking",
        "`.ghostwatch off`            — disable",
        "`.ghostwatch report`         — list ghosts (30min)",
        "`.ghostwatch report 60`      — custom threshold (60min)",
        "`.ghostwatch status`         — show current state",
        "`.ghostwatch clear`          — reset all data",
        "",
        "*What it does:*",
        "Tracks who read your messages and didn't reply after the threshold time.",
        "",
        "⚠️ _Requires blue ticks (read receipts) to be ON on both sides_"
      ].join("\n")
    }, { quoted: m });
  }
};
