const util = require("util");

module.exports = {
  name: "compile",
  aliases: ["run", "js", "eval"],
  category: "developer",
  description: "Runs JavaScript code and returns the output including console logs.",
  async execute(sock, m, args) {
    const code = args.join(" ");
    if (!code) return sock.sendMessage(m.key.remoteJid, { text: "Please provide JavaScript code to run." }, { quoted: m });

    let logs = [];
    const customConsole = {
      log: (...args) => logs.push(args.map(a => (typeof a === "object" ? util.inspect(a) : a)).join(" ")),
      error: (...args) => logs.push("ERROR: " + args.map(a => (typeof a === "object" ? util.inspect(a) : a)).join(" ")),
      warn: (...args) => logs.push("WARN: " + args.map(a => (typeof a === "object" ? util.inspect(a) : a)).join(" ")),
      info: (...args) => logs.push("INFO: " + args.map(a => (typeof a === "object" ? util.inspect(a) : a)).join(" ")),
    };

    try {
      // Create a context with common variables
      const context = {
        sock,
        m,
        args,
        console: customConsole,
        require: require,
        process: process,
        fs: require("fs-extra"),
        path: require("path"),
        util: util,
        Buffer: Buffer,
      };

      // Wrap code in an async function to support await
      const fn = new Function(...Object.keys(context), `
        return (async () => {
          ${code}
        })();
      `);

      const result = await fn(...Object.values(context));
      
      let finalOutput = "";
      if (logs.length > 0) {
        finalOutput += `*Console Logs:*\n${logs.join("\n")}\n\n`;
      }
      
      if (result !== undefined) {
        finalOutput += `*Return Value:*\n${util.inspect(result)}`;
      }

      if (!finalOutput) finalOutput = "Executed successfully with no output.";

      await sock.sendMessage(m.key.remoteJid, { text: finalOutput }, { quoted: m });
    } catch (err) {
      let errorMsg = `*Error:*\n${err.stack || err.message}`;
      if (logs.length > 0) {
        errorMsg = `*Console Logs (before error):*\n${logs.join("\n")}\n\n` + errorMsg;
      }
      await sock.sendMessage(m.key.remoteJid, { text: errorMsg }, { quoted: m });
    }
  }
};

