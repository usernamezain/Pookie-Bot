const util = require("util");

module.exports = {
  name: "json",
  category: "developer",
  description: "Formats JSON text or inspects raw message data.",
  async execute(sock, m, args) {
    const quotedMsg = m.message.extendedTextMessage?.contextInfo?.quotedMessage;
    const text = args.join(" ");

    // Case 1: Inspect Quoted Message
    if (quotedMsg) {
      try {
        await sock.sendMessage(m.key.remoteJid, { text: `🔍 *Raw Quoted Message Data:*\n\n\`\`\`json\n${JSON.stringify(quotedMsg, null, 2)}\n\`\`\`` }, { quoted: m });
        return;
      } catch (err) {
        return sock.sendMessage(m.key.remoteJid, { text: `❌ *Error inspecting message:* ${err.message}` }, { quoted: m });
      }
    }

    // Case 2: Format provided JSON text
    if (!text) {
      return sock.sendMessage(m.key.remoteJid, { 
        text: "*❌ Error:* No JSON provided.\n\n*Usage:*\n1. Reply to a message with `.json` to see its raw data.\n2. Use `.json <json_string>` to format/beautify it.\n\n*Example:* `.json {\"a\":1,\"b\":2}`" 
      }, { quoted: m });
    }

    try {
      const parsed = JSON.parse(text);
      const formatted = JSON.stringify(parsed, null, 2);
      await sock.sendMessage(m.key.remoteJid, { text: `✅ *Formatted JSON:*\n\n\`\`\`json\n${formatted}\n\`\`\`` }, { quoted: m });
    } catch (err) {
      await sock.sendMessage(m.key.remoteJid, { text: `❌ *Invalid JSON:*\n${err.message}` }, { quoted: m });
    }
  }
};
