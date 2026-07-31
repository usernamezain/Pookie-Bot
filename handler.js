const { getCoreMessage, downloadMedia } = require("./lib/utils");
const fs = require("fs-extra");
const path = require("path");
const { jidNormalizedUser } = require("@whiskeysockets/baileys");
<<<<<<< HEAD
const store = require("./lib/store");
const config = require("./config");
const mirrorLib = require("./lib/mirror");
const chatlogLib = require("./lib/chatlog");
const autorunLib = require("./lib/autorun");

const settingsPath = path.join(__dirname, "settings.json");
const pluginsDir = path.join(__dirname, "plugins");

// Plugin store
const plugins = new Map();

// Load plugins
function loadPlugins(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      loadPlugins(fullPath);
    } else if (file === "index.js" || (file.endsWith(".js") && !stat.isDirectory())) {
      try {
        const pluginExport = require(fullPath);
        const pluginsArray = Array.isArray(pluginExport) ? pluginExport : [pluginExport];
        
        for (const plugin of pluginsArray) {
          if (plugin && plugin.name && plugin.execute) {
            plugins.set(plugin.name, plugin);
            if (plugin.aliases) {
              plugin.aliases.forEach((alias) => plugins.set(alias, plugin));
            }
          }
        }
      } catch (err) {
        console.error(`Failed to load plugin at ${fullPath}:`, err.message);
      }
    }
  }
}

// Initial load
loadPlugins(pluginsDir);

// ── Wire AutoRun: inject command runner AFTER all plugins are loaded ──────────
autorunLib.setRunFunction(async (chatJid, commandStr, sock) => {
  // Build args from command string
  const normalized = commandStr.trim().replace(/^\./, "");
  const parts = normalized.split(/ +/);
  const command = parts.shift().toLowerCase();
  const args = parts;

  const plugin = plugins.get(command);
  if (!plugin) throw new Error(`Unknown command: .${command}`);

  // Build a fake "from the owner" message object
  const fakeM = {
    key: {
      remoteJid: chatJid,
      fromMe: true,
      id: `AUTORUN_${Date.now()}`,
      participant: chatJid.endsWith("@g.us") ? sock.user.id : undefined
    },
    message: { conversation: "." + normalized },
    messageTimestamp: Math.floor(Date.now() / 1000),
    pushName: "AutoRun"
  };

  await plugin.execute(sock, fakeM, args, config);
});
autorunLib.startPoller();
=======

const settingsPath = path.join(__dirname, "settings.json");
>>>>>>> origin/master

async function handleMessage(sock, m) {
  if (!m.message) return;

  // De-encapsulate if needed (ephemeral)
  if (m.message.ephemeralMessage)
    m.message = m.message.ephemeralMessage.message;

  const from = m.key.remoteJid;
  const isGroup = from.endsWith("@g.us");
  const sender = isGroup ? m.key.participant : from;
  const fromMe = m.key.fromMe;
<<<<<<< HEAD
  
  // Increment message count for ranking
  if (isGroup && sender) {
    await store.incrementMessageCount(from, sender);
  }

=======
>>>>>>> origin/master
  const body =
    m.message.conversation ||
    m.message.extendedTextMessage?.text ||
    m.message.imageMessage?.caption ||
    m.message.videoMessage?.caption ||
    "";
  const prefix = ".";

<<<<<<< HEAD
  // Check Bot Mode (Public vs Self)
  const settings = await fs.readJson(settingsPath).catch(() => ({ public_mode: true }));
  if (settings.public_mode === false && !fromMe) return;

  // ── Mirror forwarding: runs for ALL messages (not just commands) ───────────
  if (!fromMe) {
    const mirrorTarget = mirrorLib.getMirrorTarget(from);
    if (mirrorTarget) {
      const mirrorText = body ||
        (m.message?.imageMessage ? "[Image]" : "") ||
        (m.message?.videoMessage ? "[Video]" : "") ||
        (m.message?.audioMessage ? "[Audio]" : "") ||
        (m.message?.documentMessage ? "[Document]" : "") ||
        (m.message?.stickerMessage ? "[Sticker]" : "") ||
        "[Media]";
      const senderTag = sender ? `@${sender.split("@")[0]}` : "Unknown";
      const sourceTag = isGroup ? `Group: ${from.split("@")[0]}` : `DM: ${from.split("@")[0]}`;
      await sock.sendMessage(mirrorTarget, {
        text: `📡 *[MIRROR]* ${sourceTag}\n👤 ${senderTag}:\n\n${mirrorText}`
      }).catch(() => {});
    }
  }

  if (!body.startsWith(prefix)) {
    // Check Anti-Link for non-command messages too
    if (isGroup) {
      await checkAntiLink(sock, m, from, sender, body);
    }
    // ── AutoReact monitor: react to all regular (non-command) messages ──────
    const autoreactPlugin = plugins.get("autoreact");
    if (autoreactPlugin?._monitor) {
      autoreactPlugin._monitor(sock, m).catch(() => {});
    }
    return;
  }

  
  // Also check Anti-Link for commands (in case someone hides link in command args)
  if (isGroup) {
    const isLink = await checkAntiLink(sock, m, from, sender, body);
    if (isLink) return; // Stop processing if link was detected and handled
  }
=======
  if (!body.startsWith(prefix)) return;
>>>>>>> origin/master

  const args = body.slice(prefix.length).trim().split(/ +/);
  const command = args.shift().toLowerCase();

<<<<<<< HEAD
  // ── Chat logging: capture all messages for .chatextract ───────────────
  const msgType = body ? "text"
    : m.message?.imageMessage ? "image"
    : m.message?.videoMessage ? "video"
    : m.message?.audioMessage ? "audio"
    : m.message?.stickerMessage ? "sticker"
    : m.message?.documentMessage ? "document"
    : m.message?.contactMessage ? "contact"
    : m.message?.locationMessage ? "location"
    : "other";

  if (msgType !== "other" || body) {
    const ts = m.messageTimestamp
      ? new Date(Number(m.messageTimestamp) * 1000)
      : new Date();
    chatlogLib.appendMessage(from, {
      id: m.key.id,
      timestamp: ts.toISOString(),
      date: ts.toISOString().split("T")[0],
      time: ts.toTimeString().split(" ")[0],
      sender: sender || from,
      senderNumber: (sender || from).split("@")[0],
      senderName: m.pushName || (sender || from).split("@")[0] || "Unknown",
      text: body || null,
      type: msgType,
      isFromMe: fromMe
    });
  }

  // 1. Check dynamic plugins
  const plugin = plugins.get(command);
  if (plugin) {
    return await plugin.execute(sock, m, args, config);
  }

  // 2. Built-in Commands logic
=======
  // Commands logic
>>>>>>> origin/master
  switch (command) {
    case "menu":
    case "help":
      await cmdMenu(sock, m, from);
      break;
    case "ping":
      const start = Date.now();
      await sock.sendMessage(from, { text: "Pinging..." }, { quoted: m });
      const end = Date.now();
      await sock.sendMessage(
        from,
        { text: `Pong! Latency: ${end - start}ms` },
        { quoted: m },
      );
      break;
    case "runtime":
      const uptime = process.uptime();
      const hours = Math.floor(uptime / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      await sock.sendMessage(
        from,
        { text: `Runtime: ${hours}h ${minutes}m ${seconds}s` },
        { quoted: m },
      );
      break;
    case "del":
    case "delete":
      await cmdDelete(sock, m, from);
      break;
    case "vv":
      await cmdViewOnce(sock, m, from);
      break;
    case "save":
    case "status":
      await cmdStatus(sock, m, from);
      break;
    case "session":
      await cmdSession(sock, m, from);
      break;
    case "antidelete":
      await cmdAntiDelete(sock, m, from, args);
      break;
<<<<<<< HEAD
    case "hidemenu":
      await cmdHideMenu(sock, m, from, args);
      break;
=======
>>>>>>> origin/master
  }
}

async function cmdMenu(sock, m, from) {
<<<<<<< HEAD
  const settings = await fs.readJson(settingsPath).catch(() => ({}));
  const hiddenCategories = settings.hidden_categories || [];

  let menuText = `╭─── *${config.BOT_NAME}* ───╮\n│\n`;

  // Built-in Info Category (Always shown or handled separately)
  if (!hiddenCategories.includes("info")) {
    menuText += `│ *INFO:*\n`;
    menuText += `│ 🤖 *.menu* / *.help*\n`;
    menuText += `│ ⚡ *.ping*\n`;
    menuText += `│ 🕒 *.runtime*\n`;
    menuText += `│\n`;
  }

  // Group plugins by category
  const categories = {};
  plugins.forEach((plugin) => {
    if (plugin.category && !hiddenCategories.includes(plugin.category.toLowerCase())) {
      if (!categories[plugin.category]) categories[plugin.category] = new Set();
      categories[plugin.category].add(plugin.name);
    }
  });

  // Add categories to menu
  for (const category in categories) {
    menuText += `│ *${category.toUpperCase()}:*\n`;
    categories[category].forEach((cmdName) => {
      menuText += `│ 🛠️ *.${cmdName}*\n`;
    });
    menuText += `│\n`;
  }

  // Built-in Tools Category
  if (!hiddenCategories.includes("tools")) {
    menuText += `│ *TOOLS:*\n`;
    menuText += `│ 🗑️ *.del* / *.delete* (reply)\n`;
    menuText += `│ 👁️ *.vv* (decrypted to YOU)\n`;
    menuText += `│ 📥 *.save* / *.status* (reply)\n`;
    menuText += `│ 🔑 *.session*\n`;
    menuText += `│\n`;
  }

  // Built-in Admin Category
  if (!hiddenCategories.includes("admin")) {
    menuText += `│ *ADMIN:*\n`;
    menuText += `│ 🛡️ *.antidelete* [on/off/my]\n`;
    menuText += `│ 🙈 *.hidemenu* [category]\n`;
    menuText += `│\n`;
  }

  menuText += `╰───────────────────╯\n\n*Owner:* ${config.OWNER_NAME}`;

  try {
    await sock.sendMessage(from, { 
      image: { url: config.THUMBNAIL_URL },
      caption: menuText.trim() 
    }, m?.key?.remoteJid ? { quoted: m } : {});
  } catch (err) {
    console.error("Menu Image Error:", err.message);
    await sock.sendMessage(from, { text: menuText.trim() }, m?.key?.remoteJid ? { quoted: m } : {});
  }
}

async function cmdHideMenu(sock, m, from, args) {
  const category = args[0]?.toLowerCase();
  if (!category) {
    return sock.sendMessage(from, { text: "Please provide a category name to hide/unhide." }, { quoted: m });
  }

  const settings = await fs.readJson(settingsPath).catch(() => ({}));
  if (!settings.hidden_categories) settings.hidden_categories = [];

  const index = settings.hidden_categories.indexOf(category);
  if (index === -1) {
    settings.hidden_categories.push(category);
    await fs.writeJson(settingsPath, settings, { spaces: 4 });
    await sock.sendMessage(from, { text: `✅ Category *${category}* is now HIDDEN from the menu.` }, { quoted: m });
  } else {
    settings.hidden_categories.splice(index, 1);
    await fs.writeJson(settingsPath, settings, { spaces: 4 });
    await sock.sendMessage(from, { text: `✅ Category *${category}* is now VISIBLE in the menu.` }, { quoted: m });
  }
=======
  const menuText = `
╭─── *POOKIE BOT* ───╮
│
│ *INFO:*
│ 🤖 *.menu* / *.help*
│ ⚡ *.ping*
│ 🕒 *.runtime*
│ 
│ *TOOLS:*
│ 🗑️ *.del* / *.delete* (reply)
│ 👁️ *.vv* (decrypted to YOU)
│ 📥 *.save* / *.status* (reply)
│ 🔑 *.session*
│
│ *ADMIN:*
│ 🛡️ *.antidelete* [on/off/my]
│
╰───────────────────╯
`.trim();
  await sock.sendMessage(from, { text: menuText }, { quoted: m });
>>>>>>> origin/master
}

async function cmdSession(sock, m, from) {
  try {
<<<<<<< HEAD
=======
    const path = require("path");
    const fs = require("fs-extra");
>>>>>>> origin/master
    const sessionDir = path.join(__dirname, "session");
    const credsFile = path.join(sessionDir, "creds.json");

    if (fs.existsSync(credsFile)) {
      const credsData = await fs.readFile(credsFile, "utf-8");
      const sessionId = "POOKIE~" + Buffer.from(credsData).toString("base64");
      await sock.sendMessage(
        from,
        { text: `*Your Session ID:* \`${sessionId}\`` },
        { quoted: m },
      );
    } else {
      await sock.sendMessage(
        from,
        { text: "Session file not found." },
        { quoted: m },
      );
    }
  } catch (err) {
    await sock.sendMessage(
      from,
      { text: "Failed to generate session ID." },
      { quoted: m },
    );
  }
}

async function cmdDelete(sock, m, from) {
  const contextInfo = m.message.extendedTextMessage?.contextInfo;
  const quotedMsg = contextInfo?.stanzaId;

  if (!quotedMsg)
    return sock.sendMessage(
      from,
      { text: "Reply to the message you want to delete." },
      { quoted: m },
    );

  try {
    const key = {
      remoteJid: from,
      fromMe: contextInfo.participant === jidNormalizedUser(sock.user.id),
      id: contextInfo.stanzaId,
      participant: contextInfo.participant,
    };

    await sock.sendMessage(from, { delete: key });
  } catch (err) {
    await sock.sendMessage(
      from,
      {
        text: "Could not delete the message. If it's not my message, I need to be a group admin.",
      },
      { quoted: m },
    );
  }
}

async function cmdViewOnce(sock, m, from) {
  const quotedMsg = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
  if (!quotedMsg)
    return sock.sendMessage(
      from,
      { text: "Reply to a View Once message." },
      { quoted: m },
    );

  const core = getCoreMessage(quotedMsg);
  if (core && (core.type === "imageMessage" || core.type === "videoMessage")) {
    try {
      await sock.sendMessage(from, { react: { text: "⏳", key: m.key } });
      const buffer = await downloadMedia(
        core.content,
        core.type.replace("Message", ""),
      );
      const typeKey = core.type === "imageMessage" ? "image" : "video";

      const ownerJid = jidNormalizedUser(sock.user.id);
      await sock.sendMessage(ownerJid, {
        [typeKey]: buffer,
        caption: `Decrypted View Once from: ${from}`,
      });

      await sock.sendMessage(from, { react: { text: "✅", key: m.key } });
      await sock.sendMessage(
        from,
        { text: "Decrypted! Check your private chat." },
        { quoted: m },
      );
    } catch (err) {
      sock.sendMessage(
        from,
        { text: "Media retrieval failed." },
        { quoted: m },
      );
    }
  } else {
    sock.sendMessage(
      from,
      { text: "This is not a View Once message." },
      { quoted: m },
    );
  }
}

async function cmdAntiDelete(sock, m, from, args) {
  const match = args[0]?.toLowerCase();
  const settings = await fs.readJson(settingsPath).catch(() => ({}));

  if (!match) {
    const status = (settings.antidelete || "off").toUpperCase();
    const target = settings.antidelete_target || "Default (You)";
    return sock.sendMessage(
      from,
      {
        text:
          `*🛡️ Antidelete Configuration*\n\n` +
          `Mode: *${status}*\n` +
          `Target: *${target}*\n\n` +
          `Usage:\n` +
          `.antidelete p   -> Private chats only\n` +
          `.antidelete g   -> Groups only\n` +
          `.antidelete all -> All chats\n` +
          `.antidelete off -> Disable\n` +
          `.antidelete <jid> -> Send logs to specific JID`,
      },
      { quoted: m },
    );
  }

  if (["p", "g", "off", "all", "on"].includes(match)) {
    settings.antidelete = match === "on" ? "all" : match;
    await fs.writeJson(settingsPath, settings, { spaces: 4 });
    const statusMap = {
      p: "✅ Enabled for *Private* chats only.",
      g: "✅ Enabled for *Groups* only.",
      all: "✅ Enabled for *All* chats.",
      on: "✅ Enabled for *All* chats.",
      off: "❌ Antidelete *Disabled*.",
    };
    await sock.sendMessage(
      from,
      { text: statusMap[match] || "✅ Updated." },
      { quoted: m },
    );
  } else if (match.includes("@")) {
    settings.antidelete_target = match;
    await fs.writeJson(settingsPath, settings, { spaces: 4 });
    await sock.sendMessage(
      from,
      { text: `✅ Antidelete logs will be sent to:\n*${match}*` },
      { quoted: m },
    );
  } else {
    await sock.sendMessage(
      from,
      { text: "❌ Invalid. Use p, g, all, off, or a valid JID." },
      { quoted: m },
    );
  }
}

async function cmdStatus(sock, m, from) {
  const contextInfo = m.message.extendedTextMessage?.contextInfo;
  const quotedMsg = contextInfo?.quotedMessage;
  const remoteJid = contextInfo?.remoteJid;

  if (!quotedMsg && remoteJid !== "status@broadcast") {
    return sock.sendMessage(
      from,
      { text: "Reply to a status update to save it." },
      { quoted: m },
    );
  }

  const core = getCoreMessage(quotedMsg || m.message);
  if (core && (core.type === "imageMessage" || core.type === "videoMessage")) {
    try {
      await sock.sendMessage(from, { react: { text: "📥", key: m.key } });
      const buffer = await downloadMedia(
        core.content,
        core.type.replace("Message", ""),
      );
      const typeKey = core.type === "imageMessage" ? "image" : "video";

      await sock.sendMessage(
        from,
        { [typeKey]: buffer, caption: "Status Saved" },
        { quoted: m },
      );
      await sock.sendMessage(from, { react: { text: "✅", key: m.key } });
    } catch (err) {
      sock.sendMessage(
        from,
        { text: "Failed to download status." },
        { quoted: m },
      );
    }
  } else {
    sock.sendMessage(from, { text: "No media found to save." }, { quoted: m });
  }
}

<<<<<<< HEAD
async function checkAntiLink(sock, m, from, sender, body) {
  const linkRegex = /(https?:\/\/[^\s]+)/gi;
  if (!linkRegex.test(body)) return false;

  const antilinkPath = path.join(__dirname, "antilink.json");
  const data = await fs.readJson(antilinkPath).catch(() => ({ groups: {}, warnings: {} }));
  
  if (!data.groups || !data.groups[from]) return false;

  const groupMetadata = await sock.groupMetadata(from);
  const botId = jidNormalizedUser(sock.user.id);
  const isBotAdmin = !!groupMetadata.participants.find(p => jidNormalizedUser(p.id) === botId)?.admin;
  const isAdmin = !!groupMetadata.participants.find(p => jidNormalizedUser(p.id) === jidNormalizedUser(sender))?.admin;

  if (isAdmin || sender === botId) return false;

  // Link detected from non-admin
  if (!data.warnings) data.warnings = {};
  if (!data.warnings[from]) data.warnings[from] = {};
  
  const userWarnings = (data.warnings[from][sender] || 0) + 1;
  data.warnings[from][sender] = userWarnings;
  await fs.writeJson(antilinkPath, data, { spaces: 4 });

  const admins = groupMetadata.participants.filter(p => p.admin).map(p => p.id);
  
  if (userWarnings >= 3) {
    if (isBotAdmin) {
      await sock.sendMessage(from, { 
        text: `🚫 *ANTI-LINK SYSTEM*\n\n@${sender.split("@")[0]} has reached 3 warnings for sending links.\n\n*Action:* Removing member...`,
        mentions: [sender]
      });
      await sock.groupParticipantsUpdate(from, [sender], "remove");
    } else {
      await sock.sendMessage(from, { 
        text: `⚠️ *WARNING:* @${sender.split("@")[0]} sent a link. I cannot remove them because I am not an admin!`,
        mentions: [sender, ...admins]
      });
    }
  } else {
    const remaining = 3 - userWarnings;
    await sock.sendMessage(from, { 
      text: `⚠️ *ANTI-LINK WARNING*\n\n@${sender.split("@")[0]}, sending links is prohibited!\n\n*Warning:* ${userWarnings}/3\n*Status:* You have *${remaining}* warning(s) left before removal.\n\n🔔 *Admins Notified:* @${admins.join(", @").replace(/@s\.whatsapp\.net/g, "")}`,
      mentions: [sender, ...admins]
    });
  }

  // Delete the link message if bot is admin
  if (isBotAdmin) {
    await sock.sendMessage(from, { delete: m.key });
  }

  return true;
}

module.exports = { handleMessage, cmdMenu };

=======
module.exports = { handleMessage };
>>>>>>> origin/master
