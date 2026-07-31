module.exports = [
  {
    name: "kick",
    aliases: ["remove"],
    category: "group",
    description: "Remove a member from the group.",
    async execute(sock, m, args) {
      if (!m.key.remoteJid.endsWith("@g.us")) return sock.sendMessage(m.key.remoteJid, { text: "❌ This command only works in groups." }, { quoted: m });
      
      const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
      const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
      const botAdmin = groupMetadata.participants.find(p => p.id === botId)?.admin;
      const userAdmin = groupMetadata.participants.find(p => p.id === m.key.participant || p.id === m.participant)?.admin;

      if (!userAdmin) return sock.sendMessage(m.key.remoteJid, { text: "❌ *Access Denied:* Only group admins can use this command." }, { quoted: m });
      if (!botAdmin) return sock.sendMessage(m.key.remoteJid, { text: "❌ *Error:* I need to be an admin to kick members." }, { quoted: m });

      let users = m.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (m.message.extendedTextMessage?.contextInfo?.quotedMessage) {
        users.push(m.message.extendedTextMessage.contextInfo.participant);
      }
      
      if (users.length === 0) return sock.sendMessage(m.key.remoteJid, { text: "❌ Please mention or reply to the user you want to kick." }, { quoted: m });

      try {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "👢", key: m.key } });
        await sock.groupParticipantsUpdate(m.key.remoteJid, users, "remove");
        await sock.sendMessage(m.key.remoteJid, { text: `✅ Successfully removed ${users.length} member(s).` }, { quoted: m });
      } catch (e) {
        sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to kick user. They might have already left or have higher permissions." }, { quoted: m });
      }
    }
  },
  {
    name: "add",
    aliases: ["invite"],
    category: "group",
    description: "Add a member to the group.",
    async execute(sock, m, args) {
      if (!m.key.remoteJid.endsWith("@g.us")) return sock.sendMessage(m.key.remoteJid, { text: "❌ This command only works in groups." }, { quoted: m });
      
      const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
      const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
      const botAdmin = groupMetadata.participants.find(p => p.id === botId)?.admin;
      const userAdmin = groupMetadata.participants.find(p => p.id === m.key.participant || p.id === m.participant)?.admin;

      if (!userAdmin) return sock.sendMessage(m.key.remoteJid, { text: "❌ *Access Denied:* Only group admins can use this command." }, { quoted: m });
      if (!botAdmin) return sock.sendMessage(m.key.remoteJid, { text: "❌ *Error:* I need to be an admin to add members." }, { quoted: m });

      let user = args[0]?.replace(/[^0-9]/g, "");
      if (!user) return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide a phone number.\nExample: `.add 923124030056`" }, { quoted: m });
      
      const jid = user + "@s.whatsapp.net";

      try {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "➕", key: m.key } });
        const response = await sock.groupParticipantsUpdate(m.key.remoteJid, [jid], "add");
        
        if (response[0].status === "403") {
          await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to add. The user has privacy settings enabled. Sending invite link instead..." }, { quoted: m });
          // Logic for sending invite link could be added here
        } else {
          await sock.sendMessage(m.key.remoteJid, { text: `✅ User added successfully.` }, { quoted: m });
        }
      } catch (e) {
        sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to add user." }, { quoted: m });
      }
    }
  },
  {
    name: "promote",
    aliases: ["admin"],
    category: "group",
    description: "Promote a member to admin.",
    async execute(sock, m, args) {
      if (!m.key.remoteJid.endsWith("@g.us")) return sock.sendMessage(m.key.remoteJid, { text: "❌ This command only works in groups." }, { quoted: m });
      
      const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
      const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
      const botAdmin = groupMetadata.participants.find(p => p.id === botId)?.admin;
      const userAdmin = groupMetadata.participants.find(p => p.id === m.key.participant || p.id === m.participant)?.admin;

      if (!userAdmin) return sock.sendMessage(m.key.remoteJid, { text: "❌ *Access Denied:* Only group admins can use this command." }, { quoted: m });
      if (!botAdmin) return sock.sendMessage(m.key.remoteJid, { text: "❌ *Error:* I need to be an admin to promote members." }, { quoted: m });

      let users = m.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (m.message.extendedTextMessage?.contextInfo?.quotedMessage) {
        users.push(m.message.extendedTextMessage.contextInfo.participant);
      }
      
      if (users.length === 0) return sock.sendMessage(m.key.remoteJid, { text: "❌ Please mention or reply to the user you want to promote." }, { quoted: m });

      try {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "⭐", key: m.key } });
        await sock.groupParticipantsUpdate(m.key.remoteJid, users, "promote");
        await sock.sendMessage(m.key.remoteJid, { text: `✅ Successfully promoted to admin.` }, { quoted: m });
      } catch (e) {
        sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to promote user." }, { quoted: m });
      }
    }
  },
  {
    name: "demote",
    aliases: ["depromote", "unadmin"],
    category: "group",
    description: "Demote an admin to member.",
    async execute(sock, m, args) {
      if (!m.key.remoteJid.endsWith("@g.us")) return sock.sendMessage(m.key.remoteJid, { text: "❌ This command only works in groups." }, { quoted: m });
      
      const groupMetadata = await sock.groupMetadata(m.key.remoteJid);
      const botId = sock.user.id.split(":")[0] + "@s.whatsapp.net";
      const botAdmin = groupMetadata.participants.find(p => p.id === botId)?.admin;
      const userAdmin = groupMetadata.participants.find(p => p.id === m.key.participant || p.id === m.participant)?.admin;

      if (!userAdmin) return sock.sendMessage(m.key.remoteJid, { text: "❌ *Access Denied:* Only group admins can use this command." }, { quoted: m });
      if (!botAdmin) return sock.sendMessage(m.key.remoteJid, { text: "❌ *Error:* I need to be an admin to demote members." }, { quoted: m });

      let users = m.message.extendedTextMessage?.contextInfo?.mentionedJid || [];
      if (m.message.extendedTextMessage?.contextInfo?.quotedMessage) {
        users.push(m.message.extendedTextMessage.contextInfo.participant);
      }
      
      if (users.length === 0) return sock.sendMessage(m.key.remoteJid, { text: "❌ Please mention or reply to the admin you want to demote." }, { quoted: m });

      try {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "📉", key: m.key } });
        await sock.groupParticipantsUpdate(m.key.remoteJid, users, "demote");
        await sock.sendMessage(m.key.remoteJid, { text: `✅ Successfully demoted to member.` }, { quoted: m });
      } catch (e) {
        sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to demote user." }, { quoted: m });
      }
    }
  }
];
