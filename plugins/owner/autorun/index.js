const autorunLib = require("../../../lib/autorun");

const MIN_INTERVAL_MS = 60000; // 1 minute minimum to prevent spam

module.exports = {
  name: "autorun",
  aliases: ["schedule", "cron", "autotask"],
  category: "owner",
  description: "Schedule bot commands to run automatically at set intervals.",

  async execute(sock, m, args) {
    const from = m.key.remoteJid;
    const fromMe = m.key.fromMe;

    // Keep sock updated for poller
    autorunLib.setSock(sock);
    autorunLib.startPoller();

    if (!fromMe) {
      return sock.sendMessage(from, {
        text: "❌ *Access Denied:* Owner only."
      }, { quoted: m });
    }

    const action = args[0]?.toLowerCase();

    // ── .autorun list ─────────────────────────────────────────────────────────
    if (action === "list" || action === "ls") {
      const tasks = autorunLib.listTasks();
      if (!tasks.length) {
        return sock.sendMessage(from, {
          text: "⚡ *No AutoRun tasks scheduled.*\n\n_Use `.autorun add <time> <command>` to add one._"
        }, { quoted: m });
      }

      const now = Date.now();
      const lines = ["⚡ *AutoRun Tasks:*", ""];
      tasks.forEach((t, i) => {
        const left = t.nextRunAt - now;
        const leftStr = left > 0 ? autorunLib.formatMs(left) : "Running soon...";
        const cmds = t.commands || [t.command]; // handle both formats
        lines.push(`${i + 1}. ⏰ *${leftStr}* left`);
        lines.push(`   🔢 Commands (${cmds.length}):`);
        cmds.forEach((c, ci) => lines.push(`      ${ci + 1}. \`${c}\``));
        lines.push(`   🔁 Repeat: ${t.repeat ? `every ${autorunLib.formatMs(t.intervalMs)}` : "One-time"}`);
        lines.push(`   📍 Chat: \`${t.chatJid}\``);
        if (t.runCount) lines.push(`   ✅ Ran ${t.runCount} time(s)`);
        lines.push(`   🆔 ID: \`${t.id}\``);
        lines.push("");
      });
      return sock.sendMessage(from, { text: lines.join("\n") }, { quoted: m });
    }

    // ── .autorun cancel <id> ──────────────────────────────────────────────────
    if (action === "cancel" || action === "del" || action === "remove") {
      const id = args[1];
      if (!id) {
        return sock.sendMessage(from, {
          text: "Usage: `.autorun cancel <id>` — get IDs from `.autorun list`"
        }, { quoted: m });
      }
      const removed = autorunLib.removeTask(id);
      return sock.sendMessage(from, {
        text: removed
          ? `✅ *AutoRun task cancelled:* \`${id}\``
          : `❌ Task not found: \`${id}\``
      }, { quoted: m });
    }

    // ── .autorun clear ────────────────────────────────────────────────────────
    if (action === "clear" || action === "clearall") {
      autorunLib.clearAll();
      return sock.sendMessage(from, {
        text: "🗑️ *All AutoRun tasks cleared!*"
      }, { quoted: m });
    }

    // ── .autorun add <time> <cmd1>, <cmd2>, ... [--repeat] [--in <chat>] ──────
    if (action === "add" || action === "set" || action === "new") {
      let taskArgs = args.slice(1); // remove "add"

      // Extract --repeat flag
      const repeat = taskArgs.includes("--repeat");
      taskArgs = taskArgs.filter(a => a !== "--repeat");

      // Extract --in <chatJid> flag
      let targetChat = from;
      const inIdx = taskArgs.indexOf("--in");
      if (inIdx !== -1 && taskArgs[inIdx + 1]) {
        targetChat = taskArgs[inIdx + 1];
        taskArgs.splice(inIdx, 2);
      }

      const timeStr = taskArgs[0];
      // Rejoin everything after the time, then split by comma
      const rawCommands = taskArgs.slice(1).join(" ");
      const commands = rawCommands
        .split(",")
        .map(c => {
          const t = c.trim();
          return t.startsWith(".") ? t : "." + t; // ensure dot prefix
        })
        .filter(Boolean);

      if (!timeStr || commands.length === 0) {
        return sock.sendMessage(from, {
          text: [
            "⚡ *AutoRun Setup*",
            "",
            "*Single command:*",
            "  `.autorun add 10m .ping`",
            "",
            "*Command chain (comma separated):*",
            "  `.autorun add 1h .ping, .menu, .dns 8.8.8.8`",
            "",
            "*Repeating:*",
            "  `.autorun add 30m .ping, .menu --repeat`",
            "",
            "*To a different chat:*",
            "  `.autorun add 1h .menu --in 923...@s.whatsapp.net --repeat`",
            "",
            "`.autorun list`         — view all tasks",
            "`.autorun cancel <id>`  — cancel a task",
            "`.autorun clear`        — cancel all"
          ].join("\n")
        }, { quoted: m });
      }

      const intervalMs = autorunLib.parseTime(timeStr);
      if (intervalMs === 0) {
        return sock.sendMessage(from, {
          text: `❌ Invalid time: \`${timeStr}\`\n\nExamples: \`10m\`, \`1h\`, \`1h30m\`, \`30s\``
        }, { quoted: m });
      }

      if (repeat && intervalMs < MIN_INTERVAL_MS) {
        return sock.sendMessage(from, {
          text: `⚠️ Minimum repeat interval is *1 minute* to prevent bans.`
        }, { quoted: m });
      }

      const id = Date.now().toString(36).toUpperCase();
      const task = {
        id,
        chatJid: targetChat,
        commands,                    // array of commands (new format)
        command: commands[0],        // backward compat
        intervalMs,
        repeat,
        nextRunAt: Date.now() + intervalMs,
        createdAt: new Date().toISOString(),
        runCount: 0,
        lastRanAt: null
      };

      autorunLib.addTask(task);

      const cmdDisplay = commands.map((c, i) => `  ${i + 1}. \`${c}\``).join("\n");

      await sock.sendMessage(from, {
        text: [
          "⚡ *AutoRun Task Scheduled!*",
          "",
          `🔢 *Commands (${commands.length}):*`,
          cmdDisplay,
          "",
          `⏰ *First run in:* ${autorunLib.formatMs(intervalMs)}`,
          `🔁 *Type:* ${repeat ? `Repeating every ${autorunLib.formatMs(intervalMs)}` : "One-time"}`,
          `📍 *Chat:* \`${targetChat}\``,
          `🆔 *ID:* \`${id}\``,
          "",
          "_Commands run sequentially — each waits for the previous to finish._",
          `_Cancel: \`.autorun cancel ${id}\`_`
        ].join("\n")
      }, { quoted: m });

      return;
    }


    // ── Default help ──────────────────────────────────────────────────────────
    return sock.sendMessage(from, {
      text: [
        "⚡ *AutoRun — Command Scheduler*",
        "",
        "Runs bot commands automatically on a schedule.",
        "",
        "`.autorun add <time> <cmd>`         — one-time",
        "`.autorun add <time> <cmd> --repeat` — repeating",
        "`.autorun list`                      — all tasks",
        "`.autorun cancel <id>`               — stop one",
        "`.autorun clear`                     — stop all",
        "",
        "*Examples:*",
        "  `.autorun add 10m .ping`",
        "  `.autorun add 1h .menu --repeat`",
        "  `.autorun add 30m .chatextract 50 --repeat`"
      ].join("\n")
    }, { quoted: m });
  }
};
