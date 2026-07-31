const fs = require("fs-extra");
const path = require("path");

const dataPath = path.join(__dirname, "..", "data", "autoruns.json");

let sock_ref = null;
let runFn = null;       // set by handler.js after plugins load
let pollInterval = null;

// ── Time parser (same as reminder) ───────────────────────────────────────────
function parseTime(str) {
  let ms = 0;
  const h = str.match(/(\d+)h/i);
  const m = str.match(/(\d+)m/i);
  const s = str.match(/(\d+)s/i);
  if (h) ms += parseInt(h[1]) * 3600000;
  if (m) ms += parseInt(m[1]) * 60000;
  if (s) ms += parseInt(s[1]) * 1000;
  return ms;
}

function formatMs(ms) {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  let out = "";
  if (h) out += `${h}h `;
  if (m) out += `${m}m `;
  if (s || !out) out += `${s}s`;
  return out.trim();
}

// ── Storage helpers ───────────────────────────────────────────────────────────
function loadData() {
  try { return fs.readJsonSync(dataPath); } catch { return []; }
}

function saveData(data) {
  fs.ensureDirSync(path.dirname(dataPath));
  fs.writeJsonSync(dataPath, data, { spaces: 2 });
}

// ── Called by handler.js after plugins are ready ──────────────────────────────
function setRunFunction(fn) { runFn = fn; }
function setSock(sock) { sock_ref = sock; }

// ── Poller (every 10 seconds) ─────────────────────────────────────────────────
function startPoller() {
  if (pollInterval) return;
  pollInterval = setInterval(async () => {
    if (!sock_ref || !runFn) return;

    const now = Date.now();
    const tasks = loadData();
    let changed = false;

    for (let i = tasks.length - 1; i >= 0; i--) {
      const task = tasks[i];
      if (now < task.nextRunAt) continue;

      // Support both old single 'command' and new 'commands' array
      const commands = task.commands || [task.command];

      // ── Execute commands sequentially (await each one) ────────────────────
      for (let ci = 0; ci < commands.length; ci++) {
        const cmd = commands[ci].trim();
        try {
          console.log(`[autorun] [${ci + 1}/${commands.length}] Running: "${cmd}"`);
          await runFn(task.chatJid, cmd, sock_ref);
        } catch (e) {
          console.error(`[autorun] Failed "${cmd}":`, e.message);
          await sock_ref.sendMessage(task.chatJid, {
            text: `⚡ *[AutoRun Error]*\n📍 Step ${ci + 1}/${commands.length}: \`${cmd}\`\nError: _${e.message}_`
          }).catch(() => {});
          break; // Stop chain on error
        }
        // Small gap between commands so responses don't collide
        if (ci < commands.length - 1) {
          await new Promise(r => setTimeout(r, 800));
        }
      }

      if (task.repeat) {
        tasks[i].nextRunAt = now + task.intervalMs;
        tasks[i].runCount = (tasks[i].runCount || 0) + 1;
        tasks[i].lastRanAt = new Date(now).toISOString();
      } else {
        tasks.splice(i, 1); // one-time: remove after run
      }
      changed = true;
    }

    if (changed) saveData(tasks);
  }, 10000); // every 10 seconds
}

// ── Task management ───────────────────────────────────────────────────────────
function addTask(task) {
  const tasks = loadData();
  tasks.push(task);
  saveData(tasks);
}

function removeTask(id) {
  const tasks = loadData();
  const filtered = tasks.filter(t => t.id !== id);
  if (filtered.length === tasks.length) return false;
  saveData(filtered);
  return true;
}

function listTasks() { return loadData(); }
function clearAll() { saveData([]); }

module.exports = {
  parseTime,
  formatMs,
  setSock,
  setRunFunction,
  startPoller,
  addTask,
  removeTask,
  listTasks,
  clearAll
};
