const fs = require("fs-extra");
const path = require("path");

const dataPath = path.join(__dirname, "..", "..", "..", "data", "reminders.json");
let sock_ref = null; // will be set on first execute
let pollInterval = null;

// ── Time parser: "10m", "1h30m", "2h", "30s" ─────────────────────────────────
function parseTime(str) {
  let ms = 0;
  const hours = str.match(/(\d+)h/i);
  const mins = str.match(/(\d+)m/i);
  const secs = str.match(/(\d+)s/i);
  if (hours) ms += parseInt(hours[1]) * 3600000;
  if (mins) ms += parseInt(mins[1]) * 60000;
  if (secs) ms += parseInt(secs[1]) * 1000;
  return ms;
}

function formatMs(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  let out = "";
  if (h) out += `${h}h `;
  if (m) out += `${m}m `;
  if (s || !out) out += `${s}s`;
  return out.trim();
}

// ── Data helpers ──────────────────────────────────────────────────────────────
function loadReminders() {
  try { return fs.readJsonSync(dataPath); } catch { return []; }
}

function saveReminders(data) {
  fs.ensureDirSync(path.dirname(dataPath));
  fs.writeJsonSync(dataPath, data, { spaces: 2 });
}

// ── Polling: check every 15 seconds ──────────────────────────────────────────
function startPoller() {
  if (pollInterval) return;
  pollInterval = setInterval(async () => {
    if (!sock_ref) return;
    const now = Date.now();
    const reminders = loadReminders();
    const remaining = [];

    for (const r of reminders) {
      if (now >= r.triggerAt) {
        try {
          await sock_ref.sendMessage(r.targetJid, {
            text: [
              "⏰ *REMINDER!*",
              "",
              `📝 ${r.message}`,
              "",
              `_Set at: ${new Date(r.createdAt).toLocaleString()}_`
            ].join("\n")
          });
        } catch (e) {
          console.error("[reminder] Failed to send:", e.message);
        }
      } else {
        remaining.push(r);
      }
    }

    if (remaining.length !== reminders.length) {
      saveReminders(remaining);
    }
  }, 15000);
}

module.exports = {
  name: "reminder",
  aliases: ["remind", "remindme", "timer"],
  category: "owner",
  description: "Set time-based reminders with optional target JID.",

  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    const fromMe = m.key.fromMe;

    // Save sock reference for poller
    sock_ref = sock;
    startPoller();

    if (!fromMe) {
      return sock.sendMessage(from, {
        text: "❌ *Access Denied:* Owner only."
      }, { quoted: m });
    }

    // ── .reminder list ────────────────────────────────────────────────────────
    if (args[0]?.toLowerCase() === "list") {
      const reminders = loadReminders();
      if (!reminders.length) {
        return sock.sendMessage(from, { text: "⏰ *No active reminders.*" }, { quoted: m });
      }
      const now = Date.now();
      const lines = ["⏰ *Active Reminders:*", ""];
      reminders.forEach((r, i) => {
        const left = r.triggerAt - now;
        lines.push(`${i + 1}. ⏳ *${formatMs(left)} left*`);
        lines.push(`   📝 ${r.message}`);
        lines.push(`   📤 Target: \`${r.targetJid}\``);
        lines.push(`   🆔 ID: \`${r.id}\``);
        lines.push("");
      });
      return sock.sendMessage(from, { text: lines.join("\n") }, { quoted: m });
    }

    // ── .reminder cancel <id> ─────────────────────────────────────────────────
    if (args[0]?.toLowerCase() === "cancel" || args[0]?.toLowerCase() === "del") {
      const id = args[1];
      if (!id) {
        return sock.sendMessage(from, {
          text: "Usage: `.reminder cancel <id>` — get IDs from `.reminder list`"
        }, { quoted: m });
      }
      const reminders = loadReminders();
      const filtered = reminders.filter(r => r.id !== id);
      if (filtered.length === reminders.length) {
        return sock.sendMessage(from, { text: `❌ Reminder not found: \`${id}\`` }, { quoted: m });
      }
      saveReminders(filtered);
      return sock.sendMessage(from, { text: `✅ *Reminder cancelled:* \`${id}\`` }, { quoted: m });
    }

    // ── .reminder <time> <message> [--to <jid>] ───────────────────────────────
    // Parse --to flag
    let targetJid = from; // default: same chat
    let msgParts = [...args];
    const toIdx = msgParts.indexOf("--to");
    if (toIdx !== -1 && msgParts[toIdx + 1]) {
      targetJid = msgParts[toIdx + 1];
      msgParts.splice(toIdx, 2);
    }

    const timeStr = msgParts[0];
    const message = msgParts.slice(1).join(" ");
    const delayMs = timeStr ? parseTime(timeStr) : 0;

    if (!timeStr || delayMs === 0 || !message) {
      return sock.sendMessage(from, {
        text: [
          "⏰ *Reminder Command*",
          "",
          "*Usage:* `.reminder <time> <message> [--to <jid>]`",
          "",
          "*Time formats:*",
          "  `10m` = 10 minutes",
          "  `1h` = 1 hour",
          "  `1h30m` = 1 hour 30 minutes",
          "  `30s` = 30 seconds",
          "",
          "*Examples:*",
          "  `.reminder 10m Call dad`",
          "  `.reminder 1h Team meeting --to 923001234567@s.whatsapp.net`",
          "",
          "`.reminder list` — view all reminders",
          "`.reminder cancel <id>` — cancel one"
        ].join("\n")
      }, { quoted: m });
    }

    const id = Date.now().toString(36).toUpperCase();
    const reminder = {
      id,
      message,
      targetJid,
      triggerAt: Date.now() + delayMs,
      createdAt: Date.now()
    };

    const reminders = loadReminders();
    reminders.push(reminder);
    saveReminders(reminders);

    await sock.sendMessage(from, {
      text: [
        "✅ *Reminder Set!*",
        "",
        `📝 *Message:* ${message}`,
        `⏳ *In:* ${formatMs(delayMs)}`,
        `📤 *Sending to:* \`${targetJid}\``,
        `🆔 *ID:* \`${id}\``,
        "",
        "_Use `.reminder cancel " + id + "` to cancel_"
      ].join("\n")
    }, { quoted: m });
  }
};
