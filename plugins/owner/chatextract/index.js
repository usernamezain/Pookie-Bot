const { getMessages, clearLog, getStats } = require("../../../lib/chatlog");
const path = require("path");
const fs = require("fs-extra");

// Loading animation frames
const FRAMES = ["⠋", "⠙", "⠹", "⠸", "⼸", "⠴", "⠦", "⠧", "⠇", "⠏"];

// Progress bar builder
function progressBar(percent, width = 12) {
  const filled = Math.round((percent / 100) * width);
  const empty = width - filled;
  return "█".repeat(filled) + "░".repeat(empty);
}

module.exports = {
  name: "chatextract",
  aliases: ["extractchat", "chatlog", "dumplog", "chatdump"],
  category: "owner",
  description: "Extract chat history as a JSON file (date, time, sender, text).",

  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    const fromMe = m.key.fromMe;

    if (!fromMe) {
      return sock.sendMessage(from, {
        text: "❌ *Access Denied:* Owner only command."
      }, { quoted: m });
    }

    const action = args[0]?.toLowerCase();

    // ── .chatextract stats ────────────────────────────────────────────────────
    if (action === "stats") {
      const stats = getStats(from);
      if (!stats) {
        return sock.sendMessage(from, {
          text: "📊 *No chat data captured yet.*\n\n_Messages are logged while the bot is running. Start chatting and try again._"
        }, { quoted: m });
      }
      const lines = [
        "📊 *Chat Stats*",
        "",
        `💬 *Total messages:* ${stats.total}`,
        `📅 *Oldest:* ${new Date(stats.oldest).toLocaleString()}`,
        `🕐 *Newest:* ${new Date(stats.newest).toLocaleString()}`,
        "",
        "🏆 *Top Senders:*"
      ];
      stats.topSenders.forEach((s, i) => {
        lines.push(`  ${i + 1}. ${s.name} — ${s.count} msgs`);
      });
      return sock.sendMessage(from, { text: lines.join("\n") }, { quoted: m });
    }

    // ── .chatextract clear ────────────────────────────────────────────────────
    if (action === "clear") {
      clearLog(from);
      return sock.sendMessage(from, {
        text: "🗑️ *Chat log cleared!* Starting fresh."
      }, { quoted: m });
    }

    // ── .chatextract [limit] ──────────────────────────────────────────────────
    const limit = action && !isNaN(parseInt(action)) ? parseInt(action) : null;

    // ── React loading ─────────────────────────────────────────────────────────
    await sock.sendMessage(from, { react: { text: "⏳", key: m.key } });

    // ── STEP 1: Reading ───────────────────────────────────────────────────────
    const step1 = await sock.sendMessage(from, {
      text: [
        "📤 *Chat Extractor*",
        "",
        `\`[${progressBar(0)}]\` 0%`,
        `${FRAMES[0]} Reading captured messages...`
      ].join("\n")
    });

    await new Promise(r => setTimeout(r, 700));

    // ── Fetch messages ────────────────────────────────────────────────────────
    const messages = getMessages(from, limit);

    // ── STEP 2: Processing ────────────────────────────────────────────────────
    await sock.sendMessage(from, { delete: step1.key }).catch(() => {});

    const step2 = await sock.sendMessage(from, {
      text: [
        "📤 *Chat Extractor*",
        "",
        `\`[${progressBar(40)}]\` 40%`,
        `${FRAMES[3]} Found *${messages.length}* messages, processing...`
      ].join("\n")
    });

    if (!messages.length) {
      await sock.sendMessage(from, { delete: step2.key }).catch(() => {});
      await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
      return sock.sendMessage(from, {
        text: [
          "❌ *No messages captured yet.*",
          "",
          "_The bot logs messages while running._",
          "_Keep the bot active, chat a bit, then try again._",
          "",
          "`.chatextract 50` — export last 50",
          "`.chatextract stats` — see stats",
          "`.chatextract clear` — reset log"
        ].join("\n")
      }, { quoted: m });
    }

    await new Promise(r => setTimeout(r, 600));

    // ── STEP 3: Building JSON ─────────────────────────────────────────────────
    await sock.sendMessage(from, { delete: step2.key }).catch(() => {});

    const step3 = await sock.sendMessage(from, {
      text: [
        "📤 *Chat Extractor*",
        "",
        `\`[${progressBar(75)}]\` 75%`,
        `${FRAMES[6]} Building JSON structure...`
      ].join("\n")
    });

    await new Promise(r => setTimeout(r, 500));

    // ── Build export object ───────────────────────────────────────────────────
    const isGroup = from.endsWith("@g.us");
    const exportData = {
      exportInfo: {
        chat: from,
        chatType: isGroup ? "group" : "private",
        exportedAt: new Date().toISOString(),
        exportedBy: "POOKIE BOT",
        totalMessages: messages.length,
        limitApplied: limit || "none"
      },
      messages: messages.map((msg, idx) => ({
        index: idx + 1,
        id: msg.id,
        timestamp: msg.timestamp,
        date: msg.date,
        time: msg.time,
        sender: msg.sender,
        senderNumber: msg.senderNumber,
        senderName: msg.senderName,
        text: msg.text,
        type: msg.type,
        isFromMe: msg.isFromMe
      }))
    };

    const jsonStr = JSON.stringify(exportData, null, 2);
    const jsonBuffer = Buffer.from(jsonStr, "utf8");

    // ── STEP 4: Sending ───────────────────────────────────────────────────────
    await sock.sendMessage(from, { delete: step3.key }).catch(() => {});

    const step4 = await sock.sendMessage(from, {
      text: [
        "📤 *Chat Extractor*",
        "",
        `\`[${progressBar(95)}]\` 95%`,
        `${FRAMES[9]} Sending file...`
      ].join("\n")
    });

    await new Promise(r => setTimeout(r, 400));
    await sock.sendMessage(from, { delete: step4.key }).catch(() => {});

    // ── Send JSON file ────────────────────────────────────────────────────────
    const chatLabel = isGroup
      ? `group_${from.split("@")[0]}`
      : `chat_${from.split("@")[0]}`;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
    const fileName = `${chatLabel}_${timestamp}.json`;

    await sock.sendMessage(from, { react: { text: "✅", key: m.key } });

    await sock.sendMessage(from, {
      document: jsonBuffer,
      fileName,
      mimetype: "application/json",
      caption: [
        "📤 *Chat Extract Complete!*",
        `\`[${progressBar(100)}]\` 100%`,
        "",
        `📋 *Chat:* \`${from}\``,
        `💬 *Messages:* ${messages.length}`,
        `📅 *From:* ${messages[0]?.date || "N/A"}`,
        `📅 *To:* ${messages[messages.length - 1]?.date || "N/A"}`,
        `📦 *Size:* ${(jsonBuffer.length / 1024).toFixed(1)} KB`,
        "",
        "`.chatextract stats` — view stats",
        "`.chatextract clear` — reset log"
      ].join("\n")
    }, { quoted: m });
  }
};
