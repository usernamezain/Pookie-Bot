const fs = require("fs-extra");
const path = require("path");
const crypto = require("crypto");

const dataPath = path.join(__dirname, "..", "..", "..", "data", "notes.json");

// ── Crypto helpers ────────────────────────────────────────────────────────────

function hashPassword(password) {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function encrypt(text, password) {
  const key = crypto.scryptSync(password, "pookie-salt", 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

function decrypt(data, password) {
  const [ivHex, encHex] = data.split(":");
  const key = crypto.scryptSync(password, "pookie-salt", 32);
  const iv = Buffer.from(ivHex, "hex");
  const enc = Buffer.from(encHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString("utf8");
}

// ── Data helpers ──────────────────────────────────────────────────────────────

function loadData() {
  try {
    return fs.readJsonSync(dataPath);
  } catch {
    return { passwordHash: null, notes: {} };
  }
}

function saveData(data) {
  fs.ensureDirSync(path.dirname(dataPath));
  fs.writeJsonSync(dataPath, data, { spaces: 2 });
}

// ── Plugin ────────────────────────────────────────────────────────────────────

module.exports = {
  name: "note",
  aliases: ["notes", "vault"],
  category: "utility",
  description: "Encrypted personal note manager with password protection.",

  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    const fromMe = m.key.fromMe;

    if (!fromMe) {
      return sock.sendMessage(from, {
        text: "❌ *Access Denied:* Notes are private to the bot owner."
      }, { quoted: m });
    }

    const action = args[0]?.toLowerCase();
    const data = loadData();

    // ── First time: set password ──────────────────────────────────────────────
    if (!data.passwordHash && action !== "password") {
      return sock.sendMessage(from, {
        text: [
          "🔐 *Note Vault — First Time Setup*",
          "",
          "Set a password to protect your notes:",
          "`.note password set <yourpassword>`",
          "",
          "_Example:_ `.note password set mySecret123`"
        ].join("\n")
      }, { quoted: m });
    }

    // ── .note save <title> <password> <content> ───────────────────────────────
    if (action === "save" || action === "add") {
      const title = args[1];
      const password = args[2];
      const content = args.slice(3).join(" ");

      if (!title || !password || !content) {
        return sock.sendMessage(from, {
          text: "📝 *Usage:* `.note save <title> <password> <content>`\n_Example:_ `.note save wifi mypass SSID:Home123`"
        }, { quoted: m });
      }

      if (hashPassword(password) !== data.passwordHash) {
        return sock.sendMessage(from, { text: "❌ Wrong password." }, { quoted: m });
      }

      data.notes[title] = encrypt(content, password);
      saveData(data);
      return sock.sendMessage(from, {
        text: `✅ *Note saved!*\n🏷️ Title: \`${title}\`\n🔒 Encrypted & stored.`
      }, { quoted: m });
    }

    // ── .note get <title> <password> ─────────────────────────────────────────
    if (action === "get" || action === "read") {
      const title = args[1];
      const password = args[2];

      if (!title || !password) {
        return sock.sendMessage(from, {
          text: "📝 *Usage:* `.note get <title> <password>`"
        }, { quoted: m });
      }

      if (hashPassword(password) !== data.passwordHash) {
        return sock.sendMessage(from, { text: "❌ Wrong password." }, { quoted: m });
      }

      if (!data.notes[title]) {
        return sock.sendMessage(from, { text: `❌ No note found: \`${title}\`` }, { quoted: m });
      }

      try {
        const content = decrypt(data.notes[title], password);
        return sock.sendMessage(from, {
          text: `📝 *Note: ${title}*\n\n${content}`
        }, { quoted: m });
      } catch {
        return sock.sendMessage(from, { text: "❌ Decryption failed. Wrong password?" }, { quoted: m });
      }
    }

    // ── .note list ────────────────────────────────────────────────────────────
    if (action === "list" || action === "ls") {
      const titles = Object.keys(data.notes);
      if (!titles.length) {
        return sock.sendMessage(from, { text: "📝 *No notes saved yet.*" }, { quoted: m });
      }
      const lines = ["📝 *Saved Notes:*", ""];
      titles.forEach((t, i) => lines.push(`${i + 1}. 🔒 \`${t}\``));
      lines.push("");
      lines.push("_Use `.note get <title> <password>` to read_");
      return sock.sendMessage(from, { text: lines.join("\n") }, { quoted: m });
    }

    // ── .note del <title> <password> ─────────────────────────────────────────
    if (action === "del" || action === "delete" || action === "remove") {
      const title = args[1];
      const password = args[2];

      if (!title || !password) {
        return sock.sendMessage(from, {
          text: "📝 *Usage:* `.note del <title> <password>`"
        }, { quoted: m });
      }

      if (hashPassword(password) !== data.passwordHash) {
        return sock.sendMessage(from, { text: "❌ Wrong password." }, { quoted: m });
      }

      if (!data.notes[title]) {
        return sock.sendMessage(from, { text: `❌ Note not found: \`${title}\`` }, { quoted: m });
      }

      delete data.notes[title];
      saveData(data);
      return sock.sendMessage(from, {
        text: `🗑️ *Note deleted:* \`${title}\``
      }, { quoted: m });
    }

    // ── .note password set/change ─────────────────────────────────────────────
    if (action === "password" || action === "passwd") {
      const subAction = args[1]?.toLowerCase();

      // First time setup
      if (subAction === "set" && !data.passwordHash) {
        const newPass = args[2];
        if (!newPass) {
          return sock.sendMessage(from, {
            text: "📝 *Usage:* `.note password set <newpassword>`"
          }, { quoted: m });
        }
        data.passwordHash = hashPassword(newPass);
        saveData(data);
        return sock.sendMessage(from, {
          text: `✅ *Password set!*\n\n🔐 Vault is now protected.\n_Don't forget your password — notes cannot be recovered without it._`
        }, { quoted: m });
      }

      // Change password
      if (subAction === "change" || subAction === "update") {
        const oldPass = args[2];
        const newPass = args[3];

        if (!oldPass || !newPass) {
          return sock.sendMessage(from, {
            text: "📝 *Usage:* `.note password change <oldpassword> <newpassword>`"
          }, { quoted: m });
        }

        if (hashPassword(oldPass) !== data.passwordHash) {
          return sock.sendMessage(from, { text: "❌ Old password is incorrect." }, { quoted: m });
        }

        // Re-encrypt all notes with new password
        const newNotes = {};
        for (const [title, enc] of Object.entries(data.notes)) {
          try {
            const plain = decrypt(enc, oldPass);
            newNotes[title] = encrypt(plain, newPass);
          } catch {
            newNotes[title] = enc; // keep if can't decrypt
          }
        }
        data.notes = newNotes;
        data.passwordHash = hashPassword(newPass);
        saveData(data);
        return sock.sendMessage(from, {
          text: `✅ *Password changed!*\n🔐 All notes re-encrypted with new password.`
        }, { quoted: m });
      }
    }

    // ── Help ──────────────────────────────────────────────────────────────────
    return sock.sendMessage(from, {
      text: [
        "📝 *Note Vault — Commands*",
        "",
        "`.note password set <pass>`        — first-time setup",
        "`.note password change <old> <new>` — change password",
        "",
        "`.note save <title> <pass> <text>`  — save a note",
        "`.note get <title> <pass>`          — read a note",
        "`.note list`                        — list all titles",
        "`.note del <title> <pass>`          — delete a note",
        "",
        "_All notes are AES-256 encrypted 🔒_"
      ].join("\n")
    }, { quoted: m });
  }
};
