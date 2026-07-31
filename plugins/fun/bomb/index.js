// Active bomb sessions — key: chatId, value: true
const activeBombs = new Map();

module.exports = {
  name: "bomb",
  aliases: ["spam", "msgbomb"],
  category: "fun",
  description: "Send a message multiple times with safe limits.",

  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    const fromMe = m.key.fromMe;

    // ── Stop active bomb ──────────────────────────────────────────────────────
    if (args[0]?.toLowerCase() === "stop") {
      if (activeBombs.has(from)) {
        activeBombs.delete(from);
        return sock.sendMessage(from, { text: "💣 *Bomb stopped!*" }, { quoted: m });
      }
      return sock.sendMessage(from, { text: "❌ No active bomb in this chat." }, { quoted: m });
    }

    // ── Parse: .bomb <count> <message> ───────────────────────────────────────
    const count = parseInt(args[0]);
    const text = args.slice(1).join(" ");

    if (!count || isNaN(count) || !text) {
      return sock.sendMessage(from, {
        text: [
          "💣 *Message Bomb*",
          "",
          "*Usage:* `.bomb <count> <message>`",
          "*Stop:*  `.bomb stop`",
          "",
          "*Examples:*",
          "  `.bomb 5 Hello!`",
          "  `.bomb 10 🔥`",
          "",
          `⚠️ *Limits:* Max 20 messages, min 1.5s delay`,
          "_Stay safe, don't get banned!_"
        ].join("\n")
      }, { quoted: m });
    }

    // ── Hard limits ───────────────────────────────────────────────────────────
    const MAX = 20;
    const DELAY_MS = 1500; // 1.5 seconds between messages

    if (count > MAX) {
      return sock.sendMessage(from, {
        text: `⚠️ Max allowed is *${MAX} messages* to avoid bans.\nUse: \`.bomb ${MAX} ${text}\``
      }, { quoted: m });
    }

    if (activeBombs.has(from)) {
      return sock.sendMessage(from, {
        text: "⚠️ A bomb is already running in this chat. Send `.bomb stop` first."
      }, { quoted: m });
    }

    // ── Start bombing ─────────────────────────────────────────────────────────
    activeBombs.set(from, true);
    await sock.sendMessage(from, {
      text: `💣 *Bombing ${count}x* — Send \`.bomb stop\` to cancel`
    }, { quoted: m });

    for (let i = 1; i <= count; i++) {
      if (!activeBombs.has(from)) break; // stopped by user

      await sock.sendMessage(from, {
        text: `[${i}/${count}] ${text}`
      });

      if (i < count) {
        await new Promise(r => setTimeout(r, DELAY_MS));
      }
    }

    if (activeBombs.has(from)) {
      activeBombs.delete(from);
      await sock.sendMessage(from, { text: `✅ *Bomb complete!* Sent ${count} messages.` });
    }
  }
};
