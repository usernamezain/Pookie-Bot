const fs = require("fs-extra");
const path = require("path");

const configPath = path.join(__dirname, "..", "..", "..", "data", "autoreact.json");

// ── Mood sets ─────────────────────────────────────────────────────────────────
const MOOD_SETS = {
  happy:   ["😊", "😂", "🤣", "😁", "😄", "🥰", "✨"],
  angry:   ["😡", "😤", "💢", "🤬", "😠", "👿"],
  cool:    ["😎", "🕶️", "🤙", "🔥", "💎", "🤘"],
  sad:     ["😢", "😭", "💔", "😔", "🥺", "🥀"],
  love:    ["❤️", "💖", "💝", "😻", "💘", "😘", "💌"],
  party:   ["🎉", "🥳", "🎊", "🎈", "🍾", "👯‍♂️"],
  devil:   ["😈", "👹", "👺", "👻", "💀", "👿", "👽"],
  nerd:    ["🤓", "🧐", "📚", "🧠", "💻", "🧪"],
  shocked: ["😱", "😳", "😲", "🤯", "⚠️", "👀"],
  nature:  ["🌸", "🍀", "🌊", "🌈", "🌍", "🔥", "⚡"]
};

// ── Storage: { chats: { "<jid>": { status, moods } } } ───────────────────────
function loadData() {
  try { return fs.readJsonSync(configPath); } catch { return { chats: {} }; }
}

function saveData(data) {
  fs.ensureDirSync(path.dirname(configPath));
  fs.writeJsonSync(configPath, data, { spaces: 2 });
}

function getChatConfig(chatJid) {
  const data = loadData();
  return data.chats[chatJid] || { status: "off", moods: ["cool"] };
}

function setChatConfig(chatJid, cfg) {
  const data = loadData();
  if (!data.chats) data.chats = {};
  data.chats[chatJid] = cfg;
  saveData(data);
}

function removeChatConfig(chatJid) {
  const data = loadData();
  delete data.chats[chatJid];
  saveData(data);
}

// ── Monitor: called from handler.js for every incoming message ────────────────
async function monitor(sock, m) {
  try {
    if (!m.message || m.key.fromMe) return;
    const from = m.key.remoteJid;

    const cfg = getChatConfig(from);
    if (cfg.status !== "on") return;

    // Collect emojis from active moods
    let pool = [];
    cfg.moods.forEach(mood => {
      if (MOOD_SETS[mood]) pool = [...pool, ...MOOD_SETS[mood]];
    });
    if (!pool.length) return;

    const emoji = pool[Math.floor(Math.random() * pool.length)];

    // Natural random delay 0.8–2s
    await new Promise(r => setTimeout(r, 800 + Math.floor(Math.random() * 1200)));

    await sock.sendMessage(from, { react: { text: emoji, key: m.key } });
  } catch {
    // Silent — never crash for a reaction
  }
}

// ── Plugin ────────────────────────────────────────────────────────────────────
module.exports = {
  name: "autoreact",
  aliases: ["dreact", "react", "reactmode"],
  category: "owner",
  description: "Per-chat auto-react with mood-based emojis.",
  _monitor: monitor,

  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    const fromMe = m.key.fromMe;

    if (!fromMe) {
      return sock.sendMessage(from, {
        text: "❌ *Access Denied:* Owner only."
      }, { quoted: m });
    }

    const cfg = getChatConfig(from);
    const cmd = args[0]?.toLowerCase();

    // ── No args: show THIS chat's status ─────────────────────────────────────
    if (!cmd) {
      const moodList = Object.keys(MOOD_SETS)
        .map(md => `${cfg.moods.includes(md) ? "✅" : "⬜"} \`${md}\`  ${MOOD_SETS[md].slice(0, 3).join("")}`)
        .join("\n");

      return sock.sendMessage(from, {
        text: [
          "🎭 *Auto React — This Chat*",
          "",
          `🔘 *Status:* *${cfg.status.toUpperCase()}*`,
          `😄 *Active mood:* *${cfg.moods.join(", ")}*`,
          `📍 *Chat:* \`${from}\``,
          "",
          "── *Moods* ──",
          moodList,
          "",
          "── *Commands (apply to THIS chat only)* ──",
          "`.autoreact on`       — enable here",
          "`.autoreact off`      — disable here",
          "`.autoreact <mood>`   — set mood for this chat",
          "`.autoreact list`     — all active chats",
          "`.autoreact clear`    — disable everywhere",
          "",
          `*Moods:* \`${Object.keys(MOOD_SETS).join(", ")}\``
        ].join("\n")
      }, { quoted: m });
    }

    // ── on ────────────────────────────────────────────────────────────────────
    if (cmd === "on") {
      cfg.status = "on";
      setChatConfig(from, cfg);
      return sock.sendMessage(from, {
        text: [
          "✅ *Auto React ON — This Chat*",
          "",
          `😄 *Mood:* ${cfg.moods.join(", ")}`,
          `${MOOD_SETS[cfg.moods[0]]?.join("  ") || ""}`,
          "",
          "_Only THIS chat will get reactions._",
          "_Use `.autoreact off` to stop._"
        ].join("\n")
      }, { quoted: m });
    }

    // ── off ───────────────────────────────────────────────────────────────────
    if (cmd === "off") {
      removeChatConfig(from);
      return sock.sendMessage(from, {
        text: "🔴 *Auto React OFF — This Chat*\n\n_Reactions stopped in this chat only._"
      }, { quoted: m });
    }

    // ── list: all active chats ────────────────────────────────────────────────
    if (cmd === "list") {
      const data = loadData();
      const active = Object.entries(data.chats || {})
        .filter(([, v]) => v.status === "on");

      if (!active.length) {
        return sock.sendMessage(from, {
          text: "🎭 *No chats have Auto React enabled.*"
        }, { quoted: m });
      }

      const lines = ["🎭 *Active Auto React Chats:*", ""];
      active.forEach(([jid, v], i) => {
        lines.push(`${i + 1}. \`${jid}\``);
        lines.push(`   😄 Mood: *${v.moods.join(", ")}*`);
        lines.push("");
      });
      lines.push("_Use `.autoreact off` in a chat to disable it there._");
      return sock.sendMessage(from, { text: lines.join("\n") }, { quoted: m });
    }

    // ── clear: disable in all chats ──────────────────────────────────────────
    if (cmd === "clear" || cmd === "clearall") {
      saveData({ chats: {} });
      return sock.sendMessage(from, {
        text: "🗑️ *Auto React cleared everywhere!*"
      }, { quoted: m });
    }

    // ── mood set ──────────────────────────────────────────────────────────────
    if (MOOD_SETS[cmd]) {
      cfg.moods = [cmd];
      setChatConfig(from, cfg);
      const preview = MOOD_SETS[cmd].join("  ");
      return sock.sendMessage(from, {
        text: [
          `✅ *Mood set to: ${cmd.toUpperCase()}*`,
          "",
          `Reactions: ${preview}`,
          "",
          cfg.status === "on"
            ? "_Active now! Reactions will use this mood._"
            : "_Run `.autoreact on` to activate._"
        ].join("\n")
      }, { quoted: m });
    }

    // ── invalid ───────────────────────────────────────────────────────────────
    return sock.sendMessage(from, {
      text: `❌ Unknown: \`${cmd}\`\n\nMoods: \`${Object.keys(MOOD_SETS).join(", ")}\`\nOr use: \`on\`, \`off\`, \`list\`, \`clear\``
    }, { quoted: m });
  }
};
