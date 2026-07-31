const axios = require("axios");

module.exports = {
  name: "soundcloud",
  aliases: ["sc", "scdl"],
  category: "downloader",
  description: "Download audio from SoundCloud.",
  async execute(sock, m, args, config) {
    const url = args[0];
    if (!url) return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide a SoundCloud URL." }, { quoted: m });

    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🟠 *Fetching SoundCloud Audio...*" }, { quoted: m });
    
    try {
      const { data } = await axios.get(`https://api.giftedtech.co.ke/api/download/soundclouddl?apikey=${config.GIFTED_API_KEY}&url=${encodeURIComponent(url)}`);
      
      if (data.status !== 200 || !data.result) throw new Error("API Error");

      const results = Array.isArray(data.result) ? data.result : [data.result];
      const track = results[0];

      await sock.sendMessage(m.key.remoteJid, { text: `✅ *Track Found!* Sending: ${track.title}`, edit: loadingMsg.key });
      
      await sock.sendMessage(m.key.remoteJid, {
        audio: { url: track.download_url },
        mimetype: "audio/mpeg",
        fileName: `${track.title}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: track.title,
            body: `Duration: ${track.duration} | Likes: ${track.likes}`,
            thumbnailUrl: track.image,
            sourceUrl: url,
            mediaType: 1,
            showAdAttribution: true
          }
        }
      }, { quoted: m });

    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to download SoundCloud audio.", edit: loadingMsg.key });
    }
  }
};
