const whois = require("whois");
const util = require("util");

const whoisLookup = util.promisify(whois.lookup);

module.exports = {
  name: "whois",
  category: "developer",
  description: "Pulls raw WHOIS data for a domain.",
  async execute(sock, m, args) {
    const domain = args[0];
    if (!domain) {
      return sock.sendMessage(m.key.remoteJid, { 
        text: "*❌ Error:* No domain provided.\n\n*Usage:* `.whois <domain>`\n*Example:* `.whois google.com`" 
      }, { quoted: m });
    }

    try {
      await sock.sendMessage(m.key.remoteJid, { text: `🔍 Fetching WHOIS data for *${domain}*...` }, { quoted: m });
      const data = await whoisLookup(domain);
      
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*WHOIS Data for ${domain}:*\n\n\`\`\`\n${data}\n\`\`\`` 
      }, { quoted: m });
    } catch (err) {
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*❌ WHOIS Failed:*\n${err.message}` 
      }, { quoted: m });
    }
  }
};
