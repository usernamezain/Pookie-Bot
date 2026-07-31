const { evaluate } = require("mathjs");

const FORMULAS = {
  "pythagoras": "a² + b² = c² (Right-angled triangle)",
  "circle_area": "πr² (Area of a circle)",
  "quadratic": "x = [-b ± √(b² - 4ac)] / 2a (Quadratic formula)",
  "circumference": "2πr (Circumference of a circle)",
  "slope": "m = (y₂ - y₁) / (x₂ - x₁) (Slope of a line)",
  "density": "ρ = m / V (Density = Mass / Volume)",
  "speed": "s = d / t (Speed = Distance / Time)",
  "force": "F = m × a (Force = Mass × Acceleration)",
  "work": "W = F × d (Work = Force × Distance)",
  "power": "P = W / t (Power = Work / Time)"
};

module.exports = {
  name: "math",
  aliases: ["calc", "calculate"],
  category: "utility",
  description: "Calculate complex math and view math formulas.",
  async execute(sock, m, args, config) {
    const query = args.join(" ");
    
    if (!query) {
      return sock.sendMessage(m.key.remoteJid, { 
        text: "🔢 *Math Assistant*\n\n*Usage:*\n• `.math <expression>` (Evaluate math)\n• `.math list` (View curated formulas)\n\n*Example:* `.math 2 + 3 * (5 ^ 2)`" 
      }, { quoted: m });
    }

    // Check for formula list
    if (query.toLowerCase() === "list" || query.toLowerCase() === "formula") {
      let formulaText = "*乂 CURATED MATH FORMULAS 乂*\n\n";
      Object.entries(FORMULAS).forEach(([name, formula], index) => {
        formulaText += `${index + 1}. *${name.toUpperCase()}*\n   └ ${formula}\n\n`;
      });
      formulaText += "_Usage: .math <expression>_";
      return sock.sendMessage(m.key.remoteJid, { text: formulaText }, { quoted: m });
    }

    // --- Loading Animation Logic ---
    const loadingMsg = await sock.sendMessage(m.key.remoteJid, { text: "🔢 *Calculating...*" }, { quoted: m });
    const frames = [
      "🧮 [■□□□□□□□□□] 10%",
      "🧮 [■■■□□□□□□□] 30%",
      "🧮 [■■■■■■□□□□] 60%",
      "🧮 [■■■■■■■■■□] 90%",
      "✅ *Calculation Finished!*"
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
      await sock.sendMessage(m.key.remoteJid, { react: { text: "🔢", key: m.key } });

      const result = evaluate(query);

      // Finish the animation
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });

      let resultText = `*乂 MATH RESULT 乂*\n\n`;
      resultText += `📝 *Expression:* ${query}\n`;
      resultText += `🎯 *Result:* ${result}\n\n`;
      resultText += `_Generated via ${config.BOT_NAME}_`;

      await sock.sendMessage(m.key.remoteJid, { react: { text: "✅", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: resultText }, { quoted: m });

    } catch (error) {
      console.error("Math Command Error:", error.message);
      await sock.sendMessage(m.key.remoteJid, { react: { text: "❌", key: m.key } });
      await sock.sendMessage(m.key.remoteJid, { text: frames[frames.length - 1], edit: loadingMsg.key });
      await sock.sendMessage(m.key.remoteJid, { text: "❌ *Invalid Expression:* Please check your math logic." }, { quoted: m });
    }
  }
};
