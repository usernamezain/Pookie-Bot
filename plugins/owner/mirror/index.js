const { setMirror, removeMirror, listMirrors } = require("../../../lib/mirror");

module.exports = {
  name: "mirror",
  aliases: ["spy", "forward"],
  category: "owner",
  description: "Mirror all messages from this chat to another chat/JID.",

  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    const fromMe = m.key.fromMe;

    if (!fromMe) {
      return sock.sendMessage(from, {
        text: "❌ *Access Denied:* Owner only command."
      }, { quoted: m });
    }

    const action = args[0]?.toLowerCase();

    // ── .mirror on <targetJid> ───────────────────────────────────────────────
    if (action === "on" || action === "start") {
      const targetJid = args[1];
      if (!targetJid) {
        return sock.sendMessage(from, {
          text: [
            "📡 *Mirror Setup*",
            "",
            "Usage: `.mirror on <targetJid>`",
            "",
            "Example:",
            "  `.mirror on 923001234567@s.whatsapp.net`",
            "  `.mirror on 120363123456@g.us` (to a group)",
            "",
            "_Use `.jid` to find the target JID_"
          ].join("\n")
        }, { quoted: m });
      }

      setMirror(from, targetJid);
      return sock.sendMessage(from, {
        text: [
          "📡 *Mirror Activated!*",
          "",
          `📥 *Source:* \`${from}\``,
          `📤 *Target:* \`${targetJid}\``,
          "",
          "_Every message in this chat will be forwarded there._",
          "_Use `.mirror off` to stop._"
        ].join("\n")
      }, { quoted: m });
    }

    // ── .mirror off ──────────────────────────────────────────────────────────
    if (action === "off" || action === "stop") {
      removeMirror(from);
      return sock.sendMessage(from, {
        text: "✅ *Mirror deactivated.* No more forwarding from this chat."
      }, { quoted: m });
    }

    // ── .mirror list ─────────────────────────────────────────────────────────
    if (action === "list") {
      const mirrors = listMirrors();
      const entries = Object.entries(mirrors);
      if (!entries.length) {
        return sock.sendMessage(from, {
          text: "📡 *No active mirrors.*"
        }, { quoted: m });
      }
      const lines = ["📡 *Active Mirrors:*", ""];
      entries.forEach(([src, tgt], i) => {
        lines.push(`${i + 1}. 📥 \`${src}\`\n   ➡️ 📤 \`${tgt}\``);
      });
      return sock.sendMessage(from, { text: lines.join("\n") }, { quoted: m });
    }

    // ── Default usage ─────────────────────────────────────────────────────────
    return sock.sendMessage(from, {
      text: [
        "📡 *Mirror Command*",
        "",
        "`.mirror on <jid>` — start mirroring this chat",
        "`.mirror off`       — stop mirroring",
        "`.mirror list`      — view all active mirrors",
        "",
        "_Use `.jid` to get JIDs_"
      ].join("\n")
    }, { quoted: m });
  }
};
