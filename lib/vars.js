const fs = require("fs-extra");
const path = require("path");
const store = require("./store");
require("dotenv").config();

const envPath = path.join(__dirname, "..", ".env");

async function getVars() {
  const vars = {};
  // Load from process.env first
  Object.keys(process.env).forEach(key => {
    vars[key] = process.env[key];
  });
  
  // Load overrides from our JSON store
  const allCounts = await store.getAllMessageCounts(); // Just a placeholder to access storeData if needed, but I'll add a better method to store.js
  // Actually, I'll use the getSetting/saveSetting methods in store.js
  
  // For simplicity in this session, I'll fetch them from settings.json or a new category in store.json
  // But the user specifically asked for a getVars that merges them.
  
  // I'll implement a dedicated 'vars' section in store.js
  const dbVars = await store.getSetting("botVars", "all") || {};
  return { ...vars, ...dbVars };
}

async function setVar(key, value) {
  key = key.toUpperCase();
  
  // Update in our JSON store
  const dbVars = await store.getSetting("botVars", "all") || {};
  dbVars[key] = value;
  await store.saveSetting("botVars", "all", dbVars);

  // Update .env file for persistence across restarts
  updateEnvFile(key, value);

  // Update process.env for immediate effect
  process.env[key] = value;
}

async function delVar(key) {
  key = key.toUpperCase();
  const dbVars = await store.getSetting("botVars", "all") || {};
  delete dbVars[key];
  await store.saveSetting("botVars", "all", dbVars);

  removeEnvFile(key);
  delete process.env[key];
}

function updateEnvFile(key, value) {
  let content = "";
  if (fs.existsSync(envPath)) {
    content = fs.readFileSync(envPath, "utf8");
  }

  const lines = content.split("\n");
  let found = false;
  const newLines = lines.map(line => {
    if (line.trim().startsWith(`${key}=`)) {
      found = true;
      return `${key}=${value}`;
    }
    return line;
  });

  if (!found) {
    newLines.push(`${key}=${value}`);
  }

  fs.writeFileSync(envPath, newLines.join("\n").trim() + "\n");
}

function removeEnvFile(key) {
  if (!fs.existsSync(envPath)) return;
  const content = fs.readFileSync(envPath, "utf8");
  const lines = content.split("\n");
  const newLines = lines.filter(line => !line.trim().startsWith(`${key}=`));
  fs.writeFileSync(envPath, newLines.join("\n").trim() + "\n");
}

module.exports = {
  getVars,
  setVar,
  delVar
};
