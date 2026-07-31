const axios = require("axios");

module.exports = {
  name: "spotify",
  aliases: ["spotifydl", "song", "sp"],
  category: "downloader",
  description: "Download songs from Spotify.",
  async execute(sock, m, args, config) {
    const url = args[0];
    if (!url || !url.includes("spotify.com")) {
      return sock.sendMessage(m.key.remoteJid, { text: "❌ Please provide a valid Spotify track URL.\n\n*Usage:* \`.spotify <url>\`" }, { quoted: m });
    }

    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🎧 *Fetching Spotify Track...*" }, { quoted: m });
    
    try {
      const { data } = await axios.get(`https://api.giftedtech.co.ke/api/download/spotifydlv4?apikey=${config.GIFTED_API_KEY}&url=${encodeURIComponent(url)}`);
      
      if (data.status !== 200 || !data.result) throw new Error("API Error");

      const result = data.result;
      await sock.sendMessage(m.key.remoteJid, { text: "✅ *Track Found!* Sending audio...", edit: loadingMsg.key });
      
      await sock.sendMessage(m.key.remoteJid, {
        audio: { url: result.download_url },
        mimetype: "audio/mpeg",
        fileName: `${result.title} - ${result.artist}.mp3`,
        contextInfo: {
          externalAdReply: {
            title: result.title,
            body: `Artist: ${result.artist}`,
            thumbnailUrl: result.thumbnail,
            sourceUrl: url,
            mediaType: 1,
            showAdAttribution: true
          }
        }
      }, { quoted: m });

    } catch (e) {
      await sock.sendMessage(m.key.remoteJid, { text: "❌ Failed to download Spotify track. Ensure the link is a single track and public.", edit: loadingMsg.key });
    }
  }
};
