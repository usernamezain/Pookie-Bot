const { getVars, setVar, delVar } = require("../../../lib/vars");

module.exports = [
  {
    name: "setvar",
    aliases: ["set", "addvar"],
    category: "owner",
    description: "Set or update an environment/bot variable.",
    async execute(sock, m, args, config) {
      if (!m.key.fromMe) return sock.sendMessage(m.key.remoteJid, { text: "❌ *Access Denied:* Owner only." }, { quoted: m });

      const input = args.join(" ");
      if (!input.includes("=")) {
        return sock.sendMessage(m.key.remoteJid, { text: "❌ Invalid format. Use: `.setvar KEY=VALUE`" }, { quoted: m });
      }

      const [key, ...valueArr] = input.split("=");
      const value = valueArr.join("=");

      try {
        await setVar(key.trim(), value.trim());
        await sock.sendMessage(m.key.remoteJid, { text: `✅ *Variable Set:*\n\n🔑 *Key:* ${key.toUpperCase()}\n📝 *Value:* ${value}` }, { quoted: m });
      } catch (e) {
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to set variable." }, { quoted: m });
      }
    }
  },
  {
    name: "getvar",
    aliases: ["get"],
    category: "owner",
    description: "Get the value of a specific variable.",
    async execute(sock, m, args, config) {
      if (!m.key.fromMe) return sock.sendMessage(m.key.remoteJid, { text: "❌ *Access Denied:* Owner only." }, { quoted: m });

      const key = args[0]?.toUpperCase();
      if (!key) return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide a key." }, { quoted: m });

      const vars = await getVars();
      const value = vars[key];

      if (!value) {
        return sock.sendMessage(m.key.remoteJid, { text: `❌ Variable *${key}* not found.` }, { quoted: m });
      }

      await sock.sendMessage(m.key.remoteJid, { text: `📊 *Variable Found:*\n\n🔑 *Key:* ${key}\n📝 *Value:* ${value}` }, { quoted: m });
    }
  },
  {
    name: "delvar",
    aliases: ["removevar", "deletevar"],
    category: "owner",
    description: "Delete an environment/bot variable.",
    async execute(sock, m, args, config) {
      if (!m.key.fromMe) return sock.sendMessage(m.key.remoteJid, { text: "❌ *Access Denied:* Owner only." }, { quoted: m });

      const key = args[0]?.toUpperCase();
      if (!key) return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide a key." }, { quoted: m });

      try {
        await delVar(key);
        await sock.sendMessage(m.key.remoteJid, { text: `✅ Variable *${key}* deleted successfully from DB and .env.` }, { quoted: m });
      } catch (e) {
        await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to delete variable." }, { quoted: m });
      }
    }
  },
  {
    name: "listvar",
    aliases: ["allvars", "vars"],
    category: "owner",
    description: "List all active bot variables.",
    async execute(sock, m, args, config) {
      if (!m.key.fromMe) return sock.sendMessage(m.key.remoteJid, { text: "❌ *Access Denied:* Owner only." }, { quoted: m });

      const vars = await getVars();
      let text = `*乂 BOT VARIABLES 乂*\n\n`;
      
      Object.keys(vars).forEach(key => {
        // Hide sensitive keys partially
        const val = vars[key];
        const displayVal = val.length > 10 ? val.substring(0, 5) + "********" : val;
        text += `• *${key}:* ${displayVal}\n`;
      });

      await sock.sendMessage(m.key.remoteJid, { text: text.trim() }, { quoted: m });
    }
  }
];
