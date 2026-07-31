const fs = require("fs-extra");
const path = require("path");

const dataDir = path.join(__dirname, "..", "data");
const trackingPath = path.join(dataDir, "tracker_config.json");
const logPath     = path.join(dataDir, "tracker_log.json");
const seenPath    = path.join(dataDir, "tracker_seen.json");
const ghostPath   = path.join(dataDir, "tracker_ghost.json");

// ── Data helpers ───────────────────────────────────────────────────────────────
function loadJSON(p, def = {}) {
  try { return fs.readJsonSync(p); } catch { return def; }
}
function saveJSON(p, data) {
  fs.ensureDirSync(path.dirname(p));
  fs.writeJsonSync(p, data, { spaces: 2 });
}

// ── Config: tracked users + ping list ─────────────────────────────────────────
function loadConfig() {
  return loadJSON(trackingPath, { tracked: {}, pings: {} });
}
function saveConfig(c) { saveJSON(trackingPath, c); }

// ── Presence log: jid → [{ status, ts }] ─────────────────────────────────────
function loadLog() { return loadJSON(logPath, {}); }
function saveLog(l) { saveJSON(logPath, l); }

// ── Seen receipts: msgId → [{ jid, readAt }] ──────────────────────────────────
function loadSeen() { return loadJSON(seenPath, {}); }
function saveSeen(s) { saveJSON(seenPath, s); }

// ── Ghost tracker: msgId → { to, sentAt, readAt, replied, text } ─────────────
function loadGhost() { return loadJSON(ghostPath, { enabled: false, messages: {} }); }
function saveGhost(g) { saveJSON(ghostPath, g); }

// ── Public API ─────────────────────────────────────────────────────────────────

// Add a JID to track list
function addTracked(jid, reportTo, label = "") {
  const c = loadConfig();
  c.tracked[jid] = { label: label || jid.split("@")[0], reportTo, addedAt: new Date().toISOString() };
  saveConfig(c);
}
function removeTracked(jid) {
  const c = loadConfig();
  delete c.tracked[jid];
  saveConfig(c);
}
function getTracked() { return loadConfig().tracked; }
function isTracked(jid) { return !!loadConfig().tracked[jid]; }

// Add/remove online ping
function addPing(jid, reportTo) {
  const c = loadConfig();
  c.pings[jid] = { reportTo, lastPinged: null };
  saveConfig(c);
}
function removePing(jid) {
  const c = loadConfig();
  delete c.pings[jid];
  saveConfig(c);
}
function getPings() { return loadConfig().pings; }

// Get presence log for a JID
function getPresenceLog(jid, sinceMs = null) {
  const log = loadLog();
  const entries = log[jid] || [];
  if (!sinceMs) return entries;
  return entries.filter(e => new Date(e.ts).getTime() >= sinceMs);
}

// Get last known presence
function getLastKnown(jid) {
  const entries = getPresenceLog(jid);
  if (!entries.length) return null;
  return entries[entries.length - 1];
}

// Add seen receipt
function addSeenReceipt(msgId, participantJid, readAt) {
  const seen = loadSeen();
  if (!seen[msgId]) seen[msgId] = [];
  // Avoid duplicates
  if (!seen[msgId].find(e => e.jid === participantJid)) {
    seen[msgId].push({ jid: participantJid, readAt });
    saveSeen(seen);
  }
}
function getSeenFor(msgId) {
  return loadSeen()[msgId] || [];
}

// Track outgoing message for ghostwatch
function trackOutgoing(msgId, toJid, text) {
  const g = loadGhost();
  g.messages[msgId] = { to: toJid, sentAt: new Date().toISOString(), readAt: null, replied: false, text: text || "" };
  // Keep max 500 entries
  const keys = Object.keys(g.messages);
  if (keys.length > 500) delete g.messages[keys[0]];
  saveGhost(g);
}

// Mark a message as read in ghostwatch
function markGhostRead(msgId, readAt) {
  const g = loadGhost();
  if (g.messages[msgId]) {
    g.messages[msgId].readAt = readAt;
    saveGhost(g);
  }
}

// Mark sender replied (clears ghost status)
function markReplied(senderJid) {
  const g = loadGhost();
  for (const entry of Object.values(g.messages)) {
    if (entry.to === senderJid) entry.replied = true;
  }
  saveGhost(g);
}

// Get ghost report: read but not replied after X minutes
function getGhosts(afterMinutes = 30) {
  const g = loadGhost();
  const cutoff = Date.now() - afterMinutes * 60000;
  return Object.entries(g.messages)
    .filter(([, e]) => e.readAt && !e.replied && new Date(e.readAt).getTime() < cutoff)
    .map(([id, e]) => ({ id, ...e }));
}

function ghostEnabled() { return loadGhost().enabled; }
function setGhostEnabled(val) {
  const g = loadGhost();
  g.enabled = val;
  saveGhost(g);
}
function clearGhosts() {
  const g = loadGhost();
  g.messages = {};
  saveGhost(g);
}

// ── Presence event handler (called from index.js) ──────────────────────────────
async function handlePresenceUpdate(sock, id, presences) {
  try {
    const log = loadLog();
    const config = loadConfig();
    const now = new Date().toISOString();

    for (const [participantJid, presence] of Object.entries(presences)) {
      const status = presence.lastKnownPresence || "unavailable";
      const lastSeen = presence.lastSeen
        ? new Date(presence.lastSeen * 1000).toISOString()
        : null;

      // Append to log
      if (!log[participantJid]) log[participantJid] = [];
      const last = log[participantJid][log[participantJid].length - 1];
      // Only log when status actually changes
      if (!last || last.status !== status) {
        log[participantJid].push({ status, ts: now, lastSeen });
        // Keep max 2000 entries per user
        if (log[participantJid].length > 2000) log[participantJid].shift();
      }

      // ── Online ping check ───────────────────────────────────────────────────
      const pingInfo = config.pings[participantJid];
      if (pingInfo && status === "available") {
        const lastPinged = pingInfo.lastPinged ? new Date(pingInfo.lastPinged).getTime() : 0;
        const cooldown = 5 * 60 * 1000; // 5 min cooldown to avoid spam
        if (Date.now() - lastPinged > cooldown) {
          config.pings[participantJid].lastPinged = now;
          await sock.sendMessage(pingInfo.reportTo, {
            text: [
              "🟢 *[ONLINE PING]*",
              "",
              `👤 *Contact:* ${participantJid.split("@")[0]}`,
              `🕐 *Came online at:* ${new Date().toLocaleTimeString()}`,
              `📅 *Date:* ${new Date().toLocaleDateString()}`,
              "",
              `_JID: \`${participantJid}\`_`
            ].join("\n")
          }).catch(() => {});
        }
      }
    }

    saveLog(log);
    saveConfig(config);
  } catch (err) {
    console.error("[tracker] presence error:", err.message);
  }
}

// ── Receipt event handler (called from index.js) ───────────────────────────────
function handleReceipt(key, receipt) {
  try {
    const msgId = key.id;
    const participant = key.participant || key.remoteJid;

    if (receipt.readTimestamp) {
      const readAt = new Date(receipt.readTimestamp * 1000).toISOString();
      addSeenReceipt(msgId, participant, readAt);
      markGhostRead(msgId, readAt);
    }
  } catch {}
}

// ── Re-subscribe to all tracked JIDs after reconnect ──────────────────────────
async function resubscribeAll(sock) {
  const config = loadConfig();
  const allJids = [
    ...Object.keys(config.tracked),
    ...Object.keys(config.pings)
  ];
  const unique = [...new Set(allJids)];
  for (const jid of unique) {
    try {
      await sock.presenceSubscribe(jid);
      await new Promise(r => setTimeout(r, 300)); // small delay
    } catch {}
  }
  if (unique.length) console.log(`[tracker] Re-subscribed to ${unique.length} contacts`);
}

// ── Generate daily report for a tracked JID ───────────────────────────────────
function generateDailyReport(jid, label) {
  const since = Date.now() - 24 * 3600 * 1000;
  const entries = getPresenceLog(jid, since);
  if (!entries.length) return null;

  let onlineCount = 0, totalOnlineMs = 0;
  let lastOnline = null;
  const sessions = [];

  for (let i = 0; i < entries.length; i++) {
    if (entries[i].status === "available") {
      lastOnline = entries[i].ts;
      onlineCount++;
      // Find matching offline
      if (i + 1 < entries.length && entries[i + 1].status !== "available") {
        const dur = new Date(entries[i + 1].ts) - new Date(entries[i].ts);
        totalOnlineMs += dur;
        sessions.push({
          from: entries[i].ts,
          to: entries[i + 1].ts,
          durMin: Math.round(dur / 60000)
        });
      }
    }
  }

  const totalMin = Math.round(totalOnlineMs / 60000);
  const lines = [
    `📊 *Daily Report — ${label || jid.split("@")[0]}*`,
    `📅 ${new Date().toLocaleDateString()}`,
    "",
    `🟢 *Online sessions:* ${sessions.length}`,
    `⏱️ *Total online time:* ${totalMin} min`,
    `🕐 *Last seen online:* ${lastOnline ? new Date(lastOnline).toLocaleTimeString() : "N/A"}`,
    ""
  ];

  sessions.slice(-10).forEach((s, i) => {
    lines.push(`${i + 1}. ${new Date(s.from).toLocaleTimeString()} → ${new Date(s.to).toLocaleTimeString()} (${s.durMin}m)`);
  });

  return lines.join("\n");
}

module.exports = {
  addTracked, removeTracked, getTracked, isTracked,
  addPing, removePing, getPings,
  getPresenceLog, getLastKnown,
  addSeenReceipt, getSeenFor,
  trackOutgoing, markGhostRead, markReplied, getGhosts,
  ghostEnabled, setGhostEnabled, clearGhosts,
  handlePresenceUpdate, handleReceipt,
  resubscribeAll, generateDailyReport
};
