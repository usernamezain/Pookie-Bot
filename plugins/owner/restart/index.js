const { spawn } = require("child_process");
const path = require("path");

module.exports = {
  name: "restart",
  aliases: ["reboot", "rs"],
  category: "owner",
  description: "Restart the bot process.",

  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    const fromMe = m.key.fromMe;

    // ── Owner only ──────────────────────────────────────────────────────────
    if (!fromMe) {
      return sock.sendMessage(from, {
        text: "❌ *Access Denied:* This command is for the Bot Owner only."
      }, { quoted: m });
    }

    try {
      await sock.sendMessage(from, { react: { text: "🔄", key: m.key } });
      await sock.sendMessage(from, {
        text: [
          "🔄 *Restarting Bot...*",
          "",
          "_Back online in a few seconds!_"
        ].join("\n")
      }, { quoted: m });

      // Small delay so the message is sent before process exits
      setTimeout(() => {
        // Spawn a new instance of the bot detached from this process
        const child = spawn(process.execPath, process.argv.slice(1), {
          cwd: process.cwd(),
          detached: true,
          stdio: "inherit",
          env: process.env
        });
        child.unref();

        // Kill current process
        process.exit(0);
      }, 1500);

    } catch (err) {
      console.error("[restart] Error:", err.message);
      await sock.sendMessage(from, {
        text: `❌ Failed to restart: _${err.message}_`
      }, { quoted: m });
    }
  }
};
