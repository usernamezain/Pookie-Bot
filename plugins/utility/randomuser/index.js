const axios = require("axios");

module.exports = {
  name: "randomuser",
  aliases: ["fakeuser", "randomperson", "person", "genuser"],
  category: "utility",
  description: "Generate a random user profile with optional controls.",
  async execute(sock, m, args, config) {
    let gender = "";
    let nat = "";

    // Parse controls from args
    args.forEach(arg => {
      const a = arg.toLowerCase();
      if (a === "male" || a === "female") gender = a;
      if (a.length === 2) nat = a; // Assume 2-letter country code
    });

    // Build API URL
    let apiUrl = "https://randomuser.me/api/";
    const params = [];
    if (gender) params.push(`gender=${gender}`);
    if (nat) params.push(`nat=${nat}`);
    if (params.length > 0) apiUrl += `?${params.join("&")}`;

    // --- Loading Animation Logic ---
    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "👤 *Generating Random Persona...*" }, { quoted: m });
    const frames = [
      "🧬 [■□□□□□□□□□] 10%",
      "🧬 [■■■□□□□□□□] 30%",
      "🧬 [■■■■■■□□□□] 60%",
      "🧬 [■■■■■■■■■□] 90%",
      "👤 *Persona Generated!*"
    ];

    const animate = async () => {
      for (let i = 0; i < frames.length - 1; i++) {
        await new Promise(resolve => setTimeout(resolve, 400));
        await sock.sendMessage(m.key.remoteJid, { text: frames[i], edit: loadingMsg.key });
      }
    };

    // Start animation in parallel
    animate();

    try {
      await sock.sendMessage(m.key.remoteJid, { react: { text: "👤", key: m.key } });

      const { data } = await axios.get(apiUrl);
      const user = data.results[0];

      // Finish the animation
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });

      let text = `*乂 RANDOM PERSONA 乂*\n\n`;
      text += `👤 *Name:* ${user.name.title} ${user.name.first} ${user.name.last}\n`;
      text += `⚧ *Gender:* ${user.gender.toUpperCase()}\n`;
      text += `🎂 *Age:* ${user.dob.age} (${new Date(user.dob.date).toLocaleDateString()})\n`;
      text += `📧 *Email:* ${user.email}\n`;
      text += `📱 *Phone:* ${user.phone}\n`;
      text += `📍 *Location:* ${user.location.city}, ${user.location.state}, ${user.location.country}\n`;
      text += `📮 *Postcode:* ${user.location.postcode}\n`;
      text += `🔓 *Login:* ${user.login.username} / ${user.login.password}\n\n`;
      text += `_Generated via ${config.BOT_NAME}_`;

      if (user.picture && user.picture.large) {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });
        await sock.sendMessage(m.key.remoteJid, {
          image: { url: user.picture.large },
          caption: text
        }, { quoted: m });
      } else {
        await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });
        await sock.sendMessage(m.key.remoteJid, { text: text }, { quoted: m });
      }

    } catch (error) {
      console.error("Random User Error:", error.message);
      await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to generate persona." }, { quoted: m });
    }
  }
};
