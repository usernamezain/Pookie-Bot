const { downloadContentFromMessage } = require("@whiskeysockets/baileys");

async function downloadMedia(message, type) {
    const stream = await downloadContentFromMessage(message, type);
    let buffer = Buffer.from([]);
    for await (const chunk of stream) {
        buffer = Buffer.concat([buffer, chunk]);
    }
    return buffer;
}

function getCoreMessage(m) {
    if (!m) return null;
    let type = Object.keys(m)[0];
    let content = m[type];

    if (type === "viewOnceMessageV2" || type === "viewOnceMessage") {
        return getCoreMessage(content.message);
    }
    
    return { type, content };
}

module.exports = { downloadMedia, getCoreMessage };
