const store = require("../../../lib/store");

module.exports = {
  name: "rank",
  aliases: ["top", "topusers", "leaderboard", "ranks"],
  category: "group",
  description: "Show top 5 most active members based on message count.",
  async execute(sock, m, args, config) {
    if (!m.key.remoteJid.endsWith("@g.us")) {
      return sock.sendMessage(m.key.remoteJid, { text: "❌ This command only works in groups." }, { quoted: m });
    }

    // --- Loading Animation Logic ---
    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "📊 *Loading Group Activity...*" }, { quoted: m });
    const frames = [
      "📉 [■□□□□□□□□□] 10%",
      "📊 [■■■□□□□□□□] 30%",
      "📈 [■■■■■■□□□□] 60%",
      "🏆 [■■■■■■■■■□] 90%",
      "✅ *Leaderboard Ready!*"
    ];

    const animate = async () => {
      for (let i = 0; i < frames.length - 1; i++) {
        await new Promise(resolve => setTimeout(resolve, 300));
        await sock.sendMessage(m.key.remoteJid, { text: frames[i], edit: loadingMsg.key });
      }
    };

    // Start animation in parallel
    animate();

    try {
      await sock.sendMessage(m.key.remoteJid, { react: { text: "📊", key: m.key } });

      const allCounts = await store.getAllMessageCounts();
      const groupCounts = allCounts.messageCount[m.key.remoteJid] || {};

      const sortedMembers = Object.entries(groupCounts)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5);

      // Finish the animation
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });

      if (sortedMembers.length === 0) {
        return sock.sendMessage(m.key.remoteJid, {
          text: "📊 *Leaderboard Empty*\n\nNo message activity recorded yet. Start chatting to appear on the leaderboard!"
        }, { quoted: m });
      }

      const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
      let text = `*乂 TOP MEMBERS LEADERBOARD 乂*\n\n`;

      sortedMembers.forEach(([userId, count], index) => {
        const username = userId.split("@")[0];
        text += `${medals[index]} *@${username}*\n💬 ${count} Messages\n\n`;
      });

      text += `_Keep chatting to climb the ranks!_\n_Generated via ${config.BOT_NAME}_`;

      await sock.sendMessage(m.key.remoteJid, { react: { text: "🏆", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, {
        text: text,
        mentions: sortedMembers.map(([userId]) => userId)
      }, { quoted: m });

    } catch (error) {
      console.error("Rank Command Error:", error.message);
      await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to load the leaderboard." }, { quoted: m });
    }
  }
};
