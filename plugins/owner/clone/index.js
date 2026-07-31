module.exports = {
  name: "clone",
  aliases: ["clonegroup", "groupclone", "copygroup"],
  category: "owner",
  description: "Clone a WhatsApp group from an invite link into a new group.",

  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    const fromMe = m.key.fromMe;

    if (!fromMe) {
      return sock.sendMessage(from, {
        text: "❌ *Access Denied:* Owner only."
      }, { quoted: m });
    }

    const inviteLink = args[0];

    if (!inviteLink) {
      return sock.sendMessage(from, {
        text: [
          "🧬 *Group Cloner*",
          "",
          "*Usage:* `.clone <group_invite_link>`",
          "",
          "*Example:*",
          "  `.clone https://chat.whatsapp.com/XXXXXXXXXX`",
          "",
          "• Joins the source group",
          "• Gets all members",
          "• Creates new group with same name",
          "• Adds members in safe batches",
          "• Sends you the new group invite"
        ].join("\n")
      }, { quoted: m });
    }

    // Extract invite code
    const codeMatch = inviteLink.match(/chat\.whatsapp\.com\/([A-Za-z0-9]+)/);
    if (!codeMatch) {
      return sock.sendMessage(from, {
        text: "❌ Invalid invite link. Use format: `https://chat.whatsapp.com/XXXXXX`"
      }, { quoted: m });
    }
    const inviteCode = codeMatch[1];

    await sock.sendMessage(from, { react: { text: "⏳", key: m.key } });
    await sock.sendMessage(from, {
      text: "🧬 *Starting group clone...*\n\n_Step 1: Joining source group..._"
    }, { quoted: m });

    try {
      // ── Step 1: Join source group ─────────────────────────────────────────
      let sourceGroupJid;
      try {
        sourceGroupJid = await sock.groupAcceptInvite(inviteCode);
      } catch (e) {
        // Might already be in the group
        if (e.message?.includes("already")) {
          // Try to get JID from invite info
          const info = await sock.groupGetInviteInfo(inviteCode).catch(() => null);
          sourceGroupJid = info?.id;
        }
        if (!sourceGroupJid) throw e;
      }

      await new Promise(r => setTimeout(r, 2000)); // Wait for join to process

      // ── Step 2: Get group metadata ────────────────────────────────────────
      await sock.sendMessage(from, {
        text: "_Step 2: Fetching group members..._"
      }, { quoted: m });

      const metadata = await sock.groupMetadata(sourceGroupJid);
      const groupName = metadata.subject || "Cloned Group";

      // Get all participant JIDs (exclude bot)
      const botJid = sock.user.id.split(":")[0] + "@s.whatsapp.net";
      const participants = metadata.participants
        .map(p => p.id)
        .filter(jid => jid !== botJid && jid !== sock.user.id);

      await sock.sendMessage(from, {
        text: `_Found *${participants.length}* members in "${groupName}"_\n_Step 3: Creating new group..._`
      }, { quoted: m });

      // ── Step 3: Create new group ──────────────────────────────────────────
      // Start with bot only (adding too many at once can get banned)
      const newGroup = await sock.groupCreate(`${groupName} [Clone]`, []);
      const newGroupJid = newGroup.gid || Object.keys(newGroup).find(k => k.includes("@g.us"));

      await new Promise(r => setTimeout(r, 2000));

      // ── Step 4: Add members in safe batches ───────────────────────────────
      await sock.sendMessage(from, {
        text: `_Step 4: Adding members in batches of 5 (with delays)..._`
      }, { quoted: m });

      const BATCH_SIZE = 5;
      const BATCH_DELAY = 4000; // 4 seconds between batches
      let added = 0;
      let failed = 0;

      for (let i = 0; i < participants.length; i += BATCH_SIZE) {
        const batch = participants.slice(i, i + BATCH_SIZE);

        try {
          const result = await sock.groupParticipantsUpdate(newGroupJid, batch, "add");
          // Count successes
          if (Array.isArray(result)) {
            result.forEach(r => {
              if (r.status === "200" || r.status === 200) added++;
              else failed++;
            });
          } else {
            added += batch.length;
          }
        } catch (e) {
          console.error("[clone] Batch error:", e.message);
          failed += batch.length;
        }

        // Wait between batches to avoid ban
        if (i + BATCH_SIZE < participants.length) {
          await new Promise(r => setTimeout(r, BATCH_DELAY));
        }
      }

      // ── Step 5: Get invite for new group ──────────────────────────────────
      let newInvite = "";
      try {
        const inviteInfo = await sock.groupInviteCode(newGroupJid);
        newInvite = `https://chat.whatsapp.com/${inviteInfo}`;
      } catch {
        newInvite = "_(Could not get invite link)_";
      }

      // ── Leave source group (optional — keep for now) ──────────────────────
      // await sock.groupLeave(sourceGroupJid);

      await sock.sendMessage(from, { react: { text: "✅", key: m.key } });
      await sock.sendMessage(from, {
        text: [
          "✅ *Group Cloned Successfully!*",
          "",
          `📋 *Original:* ${groupName}`,
          `👥 *Members found:* ${participants.length}`,
          `✅ *Added:* ${added}`,
          `❌ *Failed/Blocked:* ${failed}`,
          "",
          `🔗 *New Group Link:*`,
          newInvite,
          "",
          "_Failed members may have blocked bots or set privacy restrictions._"
        ].join("\n")
      }, { quoted: m });

    } catch (err) {
      console.error("[clone] Error:", err.message);
      await sock.sendMessage(from, { react: { text: "❌", key: m.key } });
      await sock.sendMessage(from, {
        text: `❌ *Clone failed:*\n\n_${err.message}_`
      }, { quoted: m });
    }
  }
};
