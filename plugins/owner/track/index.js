const tracker = require("../../../lib/tracker");

module.exports = {
  name: "track",
  aliases: ["tracking", "trackuser"],
  category: "owner",
  description: "Track a contact's online/offline activity with daily reports.",

  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    if (!m.key.fromMe) return sock.sendMessage(from, { text: "❌ Owner only." }, { quoted: m });

    const sub = args[0]?.toLowerCase();

    // ── .track start <jid> [label] ────────────────────────────────────────────
    if (sub === "start" || sub === "add") {
      const jid = args[1];
      const label = args.slice(2).join(" ") || jid?.split("@")[0];
      if (!jid) return sock.sendMessage(from, {
        text: "Usage: `.track start <jid> [label]`\nExample: `.track start 923001234567@s.whatsapp.net Zain`\n\n_Use `.jid` to find the JID_"
      }, { quoted: m });

      await sock.sendMessage(from, { react: { text: "⏳", key: m.key } });
      tracker.addTracked(jid, from, label);
      await sock.presenceSubscribe(jid);
      await sock.sendMessage(from, { react: { text: "✅", key: m.key } });
      return sock.sendMessage(from, {
        text: [
          "✅ *Tracking Started!*", "",
          `👤 *Contact:* ${label}`,
          `🆔 *JID:* \`${jid}\``,
          `📤 *Reports to:* This chat`,
          "",
          "📊 Logging every time they go online/offline.",
          "",
          "`.track report <jid>` — view activity now",
          "`.track stop <jid>`   — stop tracking",
          "`.track list`         — all tracked contacts",
          "",
          "⚠️ _Works only if their last seen privacy is not set to 'Nobody'_"
        ].join("\n")
      }, { quoted: m });
    }

    // ── .track stop <jid> ────────────────────────────────────────────────────
    if (sub === "stop" || sub === "remove" || sub === "del") {
      const jid = args[1];
      if (!jid) return sock.sendMessage(from, { text: "Usage: `.track stop <jid>`" }, { quoted: m });
      tracker.removeTracked(jid);
      return sock.sendMessage(from, { text: `✅ *Stopped tracking:* \`${jid}\`` }, { quoted: m });
    }

    // ── .track list ───────────────────────────────────────────────────────────
    if (sub === "list" || sub === "ls") {
      const tracked = tracker.getTracked();
      const entries = Object.entries(tracked);
      if (!entries.length) return sock.sendMessage(from, {
        text: "📡 *No contacts being tracked.*\nUse `.track start <jid>`"
      }, { quoted: m });

      const lines = ["📡 *Tracked Contacts:*", ""];
      entries.forEach(([jid, info], i) => {
        const last = tracker.getLastKnown(jid);
        lines.push(`${i + 1}. 👤 *${info.label}*`);
        lines.push(`   🆔 \`${jid}\``);
        lines.push(`   📅 Added: ${new Date(info.addedAt).toLocaleDateString()}`);
        if (last) lines.push(`   🔘 Last: *${last.status}* @ ${new Date(last.ts).toLocaleTimeString()}`);
        else lines.push(`   🔘 No data yet`);
        lines.push("");
      });
      return sock.sendMessage(from, { text: lines.join("\n") }, { quoted: m });
    }

    // ── .track report <jid> ───────────────────────────────────────────────────
    if (sub === "report") {
      const jid = args[1];
      if (!jid) {
        // Report for all
        const tracked = tracker.getTracked();
        const entries = Object.entries(tracked);
        if (!entries.length) return sock.sendMessage(from, { text: "No tracked contacts." }, { quoted: m });
        for (const [jid, info] of entries) {
          const report = tracker.generateDailyReport(jid, info.label);
          await sock.sendMessage(from, {
            text: report || `📊 *${info.label}* — No activity in last 24h`
          }, { quoted: m });
        }
        return;
      }
      const tracked = tracker.getTracked();
      const info = tracked[jid];
      const report = tracker.generateDailyReport(jid, info?.label || jid.split("@")[0]);
      return sock.sendMessage(from, {
        text: report || `📊 No activity recorded for \`${jid}\` in the last 24h.\n\n_Make sure tracking is started and their privacy allows it._`
      }, { quoted: m });
    }

    // ── .track history <jid> [hours] ─────────────────────────────────────────
    if (sub === "history") {
      const jid = args[1];
      const hours = parseInt(args[2]) || 24;
      if (!jid) return sock.sendMessage(from, { text: "Usage: `.track history <jid> [hours]`" }, { quoted: m });

      const since = Date.now() - hours * 3600000;
      const entries = tracker.getPresenceLog(jid, since);
      if (!entries.length) return sock.sendMessage(from, {
        text: `📋 No presence data for \`${jid}\` in last ${hours}h`
      }, { quoted: m });

      const lines = [`📋 *Presence History — Last ${hours}h*`, `JID: \`${jid}\``, ""];
      entries.slice(-30).forEach(e => {
        const icon = e.status === "available" ? "🟢" : e.status === "composing" ? "✏️" : "🔴";
        lines.push(`${icon} ${e.status.toUpperCase()} — ${new Date(e.ts).toLocaleTimeString()} ${new Date(e.ts).toLocaleDateString()}`);
      });
      return sock.sendMessage(from, { text: lines.join("\n") }, { quoted: m });
    }

    // ── .track clear ──────────────────────────────────────────────────────────
    if (sub === "clear" || sub === "clearall") {
      const tracked = tracker.getTracked();
      Object.keys(tracked).forEach(j => tracker.removeTracked(j));
      return sock.sendMessage(from, { text: "🗑️ *All tracking stopped.*" }, { quoted: m });
    }

    // ── Help ──────────────────────────────────────────────────────────────────
    return sock.sendMessage(from, {
      text: [
        "📡 *Track — Commands*", "",
        "`.track start <jid> [name]` — start tracking",
        "`.track stop <jid>`        — stop tracking",
        "`.track list`              — all tracked contacts",
        "`.track report [jid]`      — 24h activity report",
        "`.track history <jid> 6`   — last 6h log",
        "`.track clear`             — stop all tracking",
        "",
        "⚠️ *Requires:* Contact's last seen not set to 'Nobody'"
      ].join("\n")
    }, { quoted: m });
  }
};
