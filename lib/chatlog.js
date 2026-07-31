const fs = require("fs-extra");
const path = require("path");

const logsDir = path.join(__dirname, "..", "data", "chatlogs");
const MAX_MESSAGES = 5000; // per chat

function getSafeFilename(chatId) {
  return chatId.replace(/[^a-zA-Z0-9]/g, "_") + ".json";
}

function getLogPath(chatId) {
  return path.join(logsDir, getSafeFilename(chatId));
}

function loadLog(chatId) {
  try {
    return fs.readJsonSync(getLogPath(chatId));
  } catch {
    return [];
  }
}

function appendMessage(chatId, entry) {
  try {
    fs.ensureDirSync(logsDir);
    const logPath = getLogPath(chatId);
    const messages = loadLog(chatId);

    // Avoid duplicates by message ID
    if (messages.some(msg => msg.id === entry.id)) return;

    messages.push(entry);

    // Rolling buffer
    if (messages.length > MAX_MESSAGES) {
      messages.splice(0, messages.length - MAX_MESSAGES);
    }

    fs.writeJsonSync(logPath, messages, { spaces: 0 }); // compact
  } catch (err) {
    // Non-fatal — don't crash the bot
    console.error("[chatlog] Write error:", err.message);
  }
}

function getMessages(chatId, limit = null) {
  const messages = loadLog(chatId);
  if (limit && limit > 0) return messages.slice(-limit);
  return messages;
}

function clearLog(chatId) {
  const logPath = getLogPath(chatId);
  if (fs.existsSync(logPath)) fs.removeSync(logPath);
}

function getStats(chatId) {
  const messages = loadLog(chatId);
  if (!messages.length) return null;

  const senders = {};
  messages.forEach(m => {
    const key = m.senderName || m.senderNumber;
    senders[key] = (senders[key] || 0) + 1;
  });

  return {
    total: messages.length,
    oldest: messages[0]?.timestamp,
    newest: messages[messages.length - 1]?.timestamp,
    topSenders: Object.entries(senders)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }))
  };
}

module.exports = { appendMessage, getMessages, clearLog, getStats };
