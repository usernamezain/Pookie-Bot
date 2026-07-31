<<<<<<< HEAD
require("dotenv").config();

// Override ISP DNS blocking — use Google + Cloudflare public DNS
const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1", "8.8.4.4"]);

=======
>>>>>>> origin/master
const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  Browsers,
  delay,
  jidNormalizedUser,
  generateForwardMessageContent,
  generateWAMessageFromContent,
  downloadContentFromMessage,
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const path = require("path");
const fs = require("fs-extra");
const readline = require("readline");
const NodeCache = require("node-cache");
<<<<<<< HEAD
const { handleMessage, cmdMenu } = require("./handler");
const trackerLib = require("./lib/tracker");

const logger = pino({ level: "silent" });

// Filtered logger: suppress noisy decrypt/session errors from heavy file transfers
const filteredLogger = pino({ level: "silent" });
filteredLogger.child = () => filteredLogger;

// ── Suppress libsignal / Baileys session noise at the lowest level ───────────
// libsignal writes directly to stdout — must intercept process.stdout.write
const NOISE_PATTERNS = [
  "Closing session", "Closing open session", "SessionEntry",
  "_chains:", "chainKey:", "messageKeys:", "chainType:",
  "registrationId:", "currentRatchet:", "ephemeralKeyPair:",
  "lastRemoteEphemeralKey:", "previousCounter:", "rootKey:",
  "indexInfo:", "baseKeyType:", "remoteIdentityKey:", "pendingPreKey:",
  "signedKeyId:", "preKeyId:", "baseKey:", "used:", "created:", "closed:",
  "Failed to decrypt message", "Session error:", "MessageCounterError",
  "Key used already or never filled", "pubKey:", "privKey:",
  "No sessions", "prekey bundle", "favor of incoming",
  "<Buffer ", "chainType: 1", "chainType: 2"
];
function _isNoise(chunk) {
  const s = typeof chunk === "string" ? chunk : chunk?.toString("utf8") || "";
  return NOISE_PATTERNS.some(p => s.includes(p));
}
const _origStdoutWrite = process.stdout.write.bind(process.stdout);
const _origStderrWrite = process.stderr.write.bind(process.stderr);
process.stdout.write = function(chunk, enc, cb) {
  if (_isNoise(chunk)) { if (typeof enc === "function") enc(); else if (cb) cb(); return true; }
  return _origStdoutWrite(chunk, enc, cb);
};
process.stderr.write = function(chunk, enc, cb) {
  if (_isNoise(chunk)) { if (typeof enc === "function") enc(); else if (cb) cb(); return true; }
  return _origStderrWrite(chunk, enc, cb);
};

const msgRetryCounterCache = new NodeCache();
const messageStore = new Map();
const processedRevokes = new Set();
const processedMessages = new NodeCache({ stdTTL: 300 });

// ── Reconnect state ───────────────────────────────────────────────────────────
let menuSentOnce = false;       // Only send menu on first connect
let lastReconnectTime = 0;      // Prevent rapid reconnect loops
=======
const { handleMessage } = require("./handler");

const logger = pino({ level: "silent" });
const msgRetryCounterCache = new NodeCache();
const messageStore = new Map(); // Store full message data
const processedRevokes = new Set(); // Prevent duplicate revoke alerts
const processedMessages = new NodeCache({ stdTTL: 300 }); // Deduplicate messages within 5 mins
>>>>>>> origin/master

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (text) => new Promise((resolve) => rl.question(text, resolve));

let isStarting = false;

async function startBot() {
  if (isStarting) return;
  isStarting = true;

  console.clear();
  console.log("\x1b[32m%s\x1b[0m", "--- POOKIE BOT (Direct Baileys) ---");

  const sessionDir = path.join(__dirname, "session");
  if (!fs.existsSync(sessionDir)) fs.mkdirSync(sessionDir);

  const { state, saveCreds } = await useMultiFileAuthState(sessionDir);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`Using Baileys v${version.join(".")} (Latest: ${isLatest})`);

  const sock = makeWASocket({
    version,
    auth: {
      creds: state.creds,
<<<<<<< HEAD
      keys: makeCacheableSignalKeyStore(state.keys, filteredLogger),
    },
    logger: filteredLogger,
=======
      keys: makeCacheableSignalKeyStore(state.keys, logger),
    },
    logger,
>>>>>>> origin/master
    browser: Browsers.ubuntu("Chrome"),
    printQRInTerminal: false,
    msgRetryCounterCache,
    markOnlineOnConnect: true,
<<<<<<< HEAD
    retryRequestDelayMs: 2000,   // wait 2s before retry on failure
    maxMsgRetryCount: 3,         // max 3 retries per message
    fireInitQueries: true,
    connectTimeoutMs: 60000,
    keepAliveIntervalMs: 25000,
=======
>>>>>>> origin/master
  });

  isStarting = false;

  // Helper: Copy and Forward
  sock.copyNForward = async (
    jid,
    message,
    forceForward = false,
    options = {},
  ) => {
    try {
      const mtype = Object.keys(message.message)[0];
      const content = await generateForwardMessageContent(
        message,
        forceForward,
      );
      const ctype = Object.keys(content)[0];

      let context = {};
      if (mtype !== "conversation" && message.message[mtype]) {
        context = message.message[mtype].contextInfo || {};
      }

      // Ensure content[ctype] is an object before setting properties
      if (content[ctype] && typeof content[ctype] === "object") {
        content[ctype].contextInfo = {
          ...context,
          ...(content[ctype].contextInfo || {}),
        };
      }

      const waMessage = await generateWAMessageFromContent(jid, content, {
        ...options,
        ...context,
        userJid: sock.user.id,
      });

      await sock.relayMessage(jid, waMessage.message, {
        messageId: waMessage.key.id,
      });
      return waMessage;
    } catch (err) {
      console.error("Error in copyNForward:", err);
    }
  };

  // Handle Pairing Code
  if (!sock.authState.creds.registered) {
    const phoneNumber = await question(
      "Please enter your phone number with country code (e.g. 923123456789): ",
    );
    const cleanedNumber = phoneNumber.replace(/[^0-9]/g, "");

    if (cleanedNumber.length < 10) {
      console.error("Invalid phone number format.");
      process.exit(1);
    }

    setTimeout(async () => {
      try {
        let code = await sock.requestPairingCode(cleanedNumber);
        code = code?.match(/.{1,4}/g)?.join("-") || code;
        console.log("\x1b[33m%s\x1b[0m", `\nYour Pairing Code: ${code}\n`);
      } catch (err) {
        console.error("Pairing Code Error:", err.message);
      }
    }, 3000);
  }

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
<<<<<<< HEAD
      const reason = Object.entries(DisconnectReason).find(([, v]) => v === statusCode)?.[0] || "Unknown";
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut && statusCode !== 401;

      console.log(`\x1b[31m[DISCONNECT]\x1b[0m Reason: ${reason} (code ${statusCode}) | Reconnecting: ${shouldReconnect}`);

      if (!shouldReconnect) {
        console.log("\x1b[33m[INFO]\x1b[0m Session logged out. Delete the 'session' folder and restart to re-pair.");
      }

      if (shouldReconnect) {
        // Cooldown: if reconnecting faster than 8s, wait longer to break loops
        const now = Date.now();
        const elapsed = now - lastReconnectTime;
        const reconnectDelay = elapsed < 8000 ? 15000 : 5000;
        lastReconnectTime = now;
        console.log(`\x1b[33m[RECONNECT]\x1b[0m Waiting ${reconnectDelay / 1000}s...`);
        setTimeout(() => startBot(), reconnectDelay);
=======
      const shouldReconnect =
        statusCode !== DisconnectReason.loggedOut && statusCode !== 401; // Avoid loop on authentication failure

      console.log(
        `Connection lost (Reason: ${lastDisconnect.error?.message}). Reconnecting: ${shouldReconnect}`,
      );

      if (shouldReconnect) {
        setTimeout(() => startBot(), 5000); // Add a delay before reconnecting
>>>>>>> origin/master
      }
    } else if (connection === "open") {
      console.clear();
      console.log("\x1b[32m%s\x1b[0m", "--- POOKIE BOT CONNECTED ---");
      const userId = jidNormalizedUser(sock.user.id);
      console.log(`Logged in as: ${userId}`);
<<<<<<< HEAD

      // Only send menu on the very first successful connection
      if (!menuSentOnce) {
        menuSentOnce = true;
        try {
          await cmdMenu(sock, { key: {} }, userId);
          console.log("Menu sent to your WhatsApp number.");
        } catch (e) {
          console.log("[WARN] Could not send startup menu:", e.message);
        }
      }

      // Re-subscribe to tracked contacts (non-blocking)
      trackerLib.resubscribeAll(sock).catch(() => {});
=======
      console.log("Commands: .del, .vv, .save (use on status)");

      // Session ID Creation
      try {
        const credsFile = path.join(sessionDir, "creds.json");
        if (fs.existsSync(credsFile)) {
          const credsData = await fs.readFile(credsFile, "utf-8");
          const sessionId =
            "POOKIE~" + Buffer.from(credsData).toString("base64");

          console.log("\x1b[35m%s\x1b[0m", "\n--- SESSION ID GENERATED ---");
          console.log(sessionId);
          console.log("----------------------------\n");

          // Send session ID to the user
          await sock.sendMessage(userId, {
            text: `*Successfully Connected!*\n\n*Session ID:* \`${sessionId}\`\n\nKeep this safe and do not share it with anyone.`,
          });
          console.log("Session ID sent to your WhatsApp number.");
        }
      } catch (sessionErr) {
        console.error("Error generating session ID:", sessionErr.message);
      }
>>>>>>> origin/master
    }
  });

  sock.ev.on("messages.upsert", async (m) => {
    if (m.type !== "notify") return;
    for (const msg of m.messages) {
      const msgId = msg.key.id;
      if (processedMessages.has(msgId)) continue;
      processedMessages.set(msgId, true);

      const mContent = msg.message;
      if (!mContent) continue;

      const type = Object.keys(mContent)[0];
      const sender = msg.key.participant || msg.key.remoteJid;
      const isGroup = msg.key.remoteJid.endsWith("@g.us");

      // Handle Anti-Delete logic (Protocol Message / REVOKE)
      if (type === "protocolMessage") {
        const pMsg = mContent.protocolMessage;
        if (pMsg.type === 0 || pMsg.type === "REVOKE") {
          const deletedMessageId = pMsg.key?.id;

          if (processedRevokes.has(deletedMessageId)) continue;
          processedRevokes.add(deletedMessageId);

          // Cleanup processedRevokes
          if (processedRevokes.size > 500) {
            const firstKey = processedRevokes.values().next().value;
            processedRevokes.delete(firstKey);
          }

          const originalMsg = messageStore.get(deletedMessageId);
          const settings = await fs
            .readJson(path.join(__dirname, "settings.json"))
            .catch(() => ({ antidelete: "off" }));

          const mode = (settings.antidelete || "off").toLowerCase();
          if (mode === "off") continue;
          if (mode === "p" && isGroup) continue;
          if (mode === "g" && !isGroup) continue;

          if (originalMsg) {
            let targetJid = settings.antidelete_target;
            if (!targetJid) {
              targetJid = jidNormalizedUser(sock.user.id);
            }

            const time = new Date().toLocaleTimeString();
            let report =
              `*🛡️ ANTI-DELETE DETECTED*\n\n` +
              `*🗑️ Deleted By:* @${sender.split("@")[0]}\n` +
              `*👤 Original Sender:* @${originalMsg.sender.split("@")[0]}\n` +
              `*🕒 Time:* ${time}\n`;

            if (isGroup) report += `*👥 Group:* ${msg.key.remoteJid}\n`;
            if (originalMsg.text)
              report += `\n*📜 Message:* ${originalMsg.text}`;

            try {
              await sock.sendMessage(targetJid, {
                text: report,
                mentions: [sender, originalMsg.sender],
              });

              if (originalMsg.mediaBuffer && originalMsg.mediaType) {
                await sock.sendMessage(targetJid, {
                  [originalMsg.mediaType]: originalMsg.mediaBuffer,
                  caption: `*Deleted Media* (restored)`,
                  contextInfo: { mentionedJid: [originalMsg.sender] },
                });
              }
            } catch (err) {
              console.error("Anti-Delete Notification Error:", err.message);
            }
          }
          continue; // Don't process protocol messages further
        }
      }

      // Store Message Logic
      if (type === "senderKeyDistributionMessage") continue;

      let storedData = {
        sender: sender,
        timestamp: Date.now(),
        text: null,
        mediaBuffer: null,
        mediaType: null,
      };

      // Extract Content
      if (mContent.conversation) storedData.text = mContent.conversation;
      else if (mContent.extendedTextMessage)
        storedData.text = mContent.extendedTextMessage.text;
      else if (mContent.imageMessage) {
        storedData.mediaType = "image";
        storedData.text = mContent.imageMessage.caption;
      } else if (mContent.videoMessage) {
        storedData.mediaType = "video";
        storedData.text = mContent.videoMessage.caption;
      } else if (mContent.stickerMessage) {
        storedData.mediaType = "sticker";
      } else if (mContent.audioMessage) {
        storedData.mediaType = "audio";
      } else if (mContent.viewOnceMessageV2 || mContent.viewOnceMessage) {
        const viewOnceMsg =
          mContent.viewOnceMessageV2?.message ||
          mContent.viewOnceMessage?.message;
        if (viewOnceMsg) {
          const vType = Object.keys(viewOnceMsg)[0];
          storedData.mediaType = vType.replace("Message", "");
          storedData.text = viewOnceMsg[vType].caption;

          // Anti-ViewOnce Logic
          try {
            const stream = await downloadContentFromMessage(
              viewOnceMsg[vType],
              storedData.mediaType,
            );
            let buffer = Buffer.from([]);
            for await (const chunk of stream) {
              buffer = Buffer.concat([buffer, chunk]);
            }
            storedData.mediaBuffer = buffer;

            const settings = await fs
              .readJson(path.join(__dirname, "settings.json"))
              .catch(() => ({ anti_viewonce: "true" }));

            if (settings.anti_viewonce !== "false") {
              const targetJid =
                settings.antidelete_target || jidNormalizedUser(sock.user.id);
              await sock.sendMessage(targetJid, {
                [storedData.mediaType]: buffer,
                caption: `*👻 Anti-ViewOnce Detected*\nFrom: @${sender.split("@")[0]}`,
                mentions: [sender],
              });
            }
          } catch (err) {
            console.error("Anti-ViewOnce Error:", err.message);
          }
        }
      }

      // Auto-download small media for tracking (images/stickers)
      if (
        ["image", "sticker"].includes(storedData.mediaType) &&
        !storedData.mediaBuffer
      ) {
        try {
          const mediaKey = mContent.imageMessage || mContent.stickerMessage;
          const stream = await downloadContentFromMessage(
            mediaKey,
            storedData.mediaType,
          );
          let buffer = Buffer.from([]);
          for await (const chunk of stream) {
            buffer = Buffer.concat([buffer, chunk]);
          }
          storedData.mediaBuffer = buffer;
        } catch (e) {
          console.error("Media store fail:", e.message);
        }
      }

      messageStore.set(msgId, storedData);

      // Cleanup oldest messages
      if (messageStore.size > 1000) {
        const firstKey = messageStore.keys().next().value;
        messageStore.delete(firstKey);
      }

      await handleMessage(sock, msg);
    }
  });
<<<<<<< HEAD

  // ── Presence tracking (for .track / .onlineping / .lastseen) ─────────────
  sock.ev.on("presence.update", async ({ id, presences }) => {
    await trackerLib.handlePresenceUpdate(sock, id, presences);
  });

  // ── Read receipts (for .ghostwatch / .seen) ───────────────────────────────
  sock.ev.on("message-receipt.update", async (updates) => {
    for (const { key, receipt } of updates) {
      trackerLib.handleReceipt(key, receipt);
    }
  });
}

// ── Global Error Handling ─────────────────────────────────────────────────────
// These errors are EXPECTED during reconnection — filter them out silently
const KNOWN_TRANSIENT_ERRORS = [
  "Connection Closed",
  "Connection Terminated",
  "connection closed",
  "MessageCounterError",
  "Key used already or never filled",
  "connection replaced",
  "Timed Out",
  "ECONNRESET",
  "ENOTFOUND",
  "socket hang up",
  "No sessions",
  "prekey bundle",
  "favor of incoming prekey",
];

function isKnownTransient(err) {
  if (!err) return false;
  const msg = (err.message || err.toString() || "").toLowerCase();
  return KNOWN_TRANSIENT_ERRORS.some(e => msg.includes(e.toLowerCase()));
}

process.on("unhandledRejection", (reason) => {
  if (isKnownTransient(reason)) return; // Silently ignore expected reconnect errors
  console.error("\x1b[31m[ERROR]\x1b[0m Unhandled Rejection:", reason?.message || reason);
});

process.on("uncaughtException", (err) => {
  if (isKnownTransient(err)) return; // Silently ignore
  console.error("\x1b[31m[FATAL]\x1b[0m Uncaught Exception:", err.message);
  console.error(err.stack);
=======
}

// Global Error Handling
process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
>>>>>>> origin/master
});

startBot().catch((err) => console.error("Startup Failure:", err));
