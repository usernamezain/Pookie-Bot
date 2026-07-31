const axios = require("axios");
const fs = require("fs-extra");
const path = require("path");
const { jidNormalizedUser } = require("@whiskeysockets/baileys");

const envPath = path.join(__dirname, "..", "..", "..", ".env");

// ── Write/update a key in .env file ─────────────────────────────────────────
function updateEnv(key, value) {
  let content = "";
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf8");
  }
  const lines = content.split("\n");
  let found = false;
  const newLines = lines.map(line => {
    if (line.trim().startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });
  if (!found) newLines.push(`${key}=${value}`);
  fs.writeFileSync(envPath, newLines.join("\n").trimEnd() + "\n");
  // Update live process too
  process.env[key] = value;
}

module.exports = {
  name: "setppurl",
  aliases: ["setdpurl", "setpplink", "dpurl"],
  category: "owner",
  description: "Set the bot profile picture from an image URL (also updates menu thumbnail).",

  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    const fromMe = m.key.fromMe;

    // ── Owner only ──────────────────────────────────────────────────────────
    if (!fromMe) {
      return sock.sendMessage(from, {
        text: "❌ *Access Denied:* This command is for the Bot Owner only."
      }, { quoted: m });
    }

    const imageUrl = args[0];

    // ── Usage guide ─────────────────────────────────────────────────────────
    if (!imageUrl) {
      return sock.sendMessage(from, {
        text: [
          "🖼️ *Set Bot Profile Picture via URL*",
          "",
          "*Usage:*  `.setppurl <image link>`",
          "",
          "*Example:*",
          "  `.setppurl https://i.imgur.com/abc123.jpg`",
          "",
          "_Also updates the menu thumbnail to the same image._"
        ].join("\n")
      }, { quoted: m });
    }

    // ── Validate URL ─────────────────────────────────────────────────────────
    try {
      const p = new URL(imageUrl);
      if (!["http:", "https:"].includes(p.protocol)) throw new Error();
    } catch {
      return sock.sendMessage(from, {
        text: "❌ Invalid URL. Provide a direct image link starting with `http://` or `https://`."
      }, { quoted: m });
    }

    await sock.sendMessage(from, { react: { text: "⏳", key: m.key } });

    try {
      // 1. Download image buffer
      const response = await axios.get(imageUrl, {
        responseType: "arraybuffer",
        timeout: 20000,
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/122 Safari/537.36",
          "Accept": "image/webp,image/apng,image/*,*/*;q=0.8"
        }
      });

      const contentType = response.headers["content-type"] || "";
      if (!contentType.includes("image") && !contentType.includes("octet-stream")) {
        await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
        return sock.sendMessage(from, {
          text: `❌ URL doesn't seem to be an image.\n_Content-Type:_ \`${contentType}\``
        }, { quoted: m });
      }

      const buffer = Buffer.from(response.data);
      const botJid = jidNormalizedUser(sock.user.id);

      // 2. Set WhatsApp profile picture
      await sock.updateProfilePicture(botJid, buffer);

      // 3. Save URL to .env as THUMBNAIL_URL (persists across restarts)
      updateEnv("THUMBNAIL_URL", imageUrl);

      // 4. Confirm with the image
      await sock.sendMessage(from, { react: { text: "✅", key: m.key } });
      await sock.sendMessage(from, {
        image: buffer,
        caption: [
          "✅ *Bot DP + Menu Thumbnail Updated!*",
          "",
          `🔗 *URL:* ${imageUrl}`,
          "",
          "• Bot profile picture changed 🖼️",
          "• Menu thumbnail saved to .env 💾",
          "• No restart needed — both live immediately!"
        ].join("\n")
      }, { quoted: m });

    } catch (err) {
      console.error("[setppurl] Error:", err.message);
      let errText = "❌ *Failed to update profile picture.*\n\n";
      if (err.response?.status === 403) errText += "_Access denied (403). Host blocks direct downloads._";
      else if (err.response?.status === 404) errText += "_Image not found (404)._";
      else if (err.code === "ETIMEDOUT") errText += "_Download timed out._";
      else if (err.code === "ENOTFOUND") errText += "_Could not reach server._";
      else errText += `_${err.message}_`;

      await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
      await sock.sendMessage(from, { text: errText }, { quoted: m });
    }
  }
};
