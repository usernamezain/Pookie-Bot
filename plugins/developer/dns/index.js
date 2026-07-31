const dns = require("node:dns").promises;
const util = require("util");

module.exports = {
  name: "dns",
  category: "developer",
  description: "Lookup DNS records for a domain.",
  async execute(sock, m, args) {
    const domain = args[0];
    if (!domain) {
      return sock.sendMessage(m.key.remoteJid, { 
        text: "*❌ Error:* No domain provided.\n\n*Usage:* `.dns <domain>`\n*Example:* `.dns google.com`" 
      }, { quoted: m });
    }

    try {
      await sock.sendMessage(m.key.remoteJid, { text: `🌐 Looking up DNS records for *${domain}*...` }, { quoted: m });
      
      const results = {};
      
      // Attempt to fetch multiple record types
      try { results.A = await dns.resolve4(domain); } catch (e) {}
      try { results.AAAA = await dns.resolve6(domain); } catch (e) {}
      try { results.MX = await dns.resolveMx(domain); } catch (e) {}
      try { results.NS = await dns.resolveNs(domain); } catch (e) {}
      try { results.TXT = await dns.resolveTxt(domain); } catch (e) {}

      let output = `*DNS Records for ${domain}:*\n\n`;
      
      for (const [type, data] of Object.entries(results)) {
        if (data && data.length > 0) {
          output += `*${type}:*\n${util.inspect(data)}\n\n`;
        }
      }

      if (Object.keys(results).length === 0 || output === `*DNS Records for ${domain}:*\n\n`) {
        output = `*❌ No DNS records found for ${domain}.*`;
      }

      await sock.sendMessage(m.key.remoteJid, { text: output.trim() }, { quoted: m });
    } catch (err) {
      await sock.sendMessage(m.key.remoteJid, { 
        text: `*❌ DNS Lookup Failed:*\n${err.message}` 
      }, { quoted: m });
    }
  }
};
