module.exports = [
  {
    name: "tagall",
    aliases: ["everyone", "all"],
    category: "group",
    description: "Tag every member in the group with a message.",
    async execute(sock, m, args) {
      if (!m.key.remoteJid.endsWith("@g.us")) return sock.sendMessage(m.key.remoteJid, { text: "❌ This command only works in groups." }, { quoted: m });
      
      const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
      const participants = groupMetadata.participants;
      const userAdmin = participants.find(p => p.id === m.key.participant || p.id === m.participant)?.admin;

      if (!userAdmin) return sock.sendMessage(m.key.remoteJid, { text: "❌ *Access Denied:* Only group admins can use this command." }, { quoted: m });

      const message = args.join(" ") || "No Message";
      let text = `*乂 TAG ALL MEMBERS 乂*\n\n`;
      text += `📢 *Message:* ${message}\n\n`;
      
      participants.forEach((p, index) => {
        text += `${index + 1}. @${p.id.split("@")[0]}\n`;
      });
      
      text += `\n_Total: ${participants.length}_`;

      await sock.sendMessage(m.key.remoteJid, { 
        text: text, 
        mentions: participants.map(p => p.id) 
      }, { quoted: m });
    }
  },
  {
    name: "tag",
    aliases: ["hidetag", "ghosttag"],
    category: "group",
    description: "Mention everyone hiddenly with a custom message.",
    async execute(sock, m, args) {
      if (!m.key.remoteJid.endsWith("@g.us")) return sock.sendMessage(m.key.remoteJid, { text: "❌ This command only works in groups." }, { quoted: m });
      
      const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
      const participants = groupMetadata.participants;
      const userAdmin = participants.find(p => p.id === m.key.participant || p.id === m.participant)?.admin;

      if (!userAdmin) return sock.sendMessage(m.key.remoteJid, { text: "❌ *Access Denied:* Only group admins can use this command." }, { quoted: m });

      let message = args.join(" ");
      if (!message && m.message.extendedTextMessage?.contextInfo?.quotedMessage) {
        message = m.message.extendedTextMessage.contextInfo.quotedMessage.conversation || 
                  m.message.extendedTextMessage.contextInfo.quotedMessage.extendedTextMessage?.text;
      }

      if (!message) return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide a message or reply to one." }, { quoted: m });

      // Hidden tag (ghost tag)
      await sock.sendMessage(m.key.remoteJid, { 
        text: message, 
        mentions: participants.map(p => p.id) 
      });
    }
  }
];
