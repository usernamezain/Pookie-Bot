const fs = require("fs-extra");
const path = require("path");

const dataPath = path.join(__dirname, "..", "data", "mirrors.json");

function loadMirrors() {
  try {
    return fs.readJsonSync(dataPath);
  } catch {
    return {};
  }
}

function saveMirrors(data) {
  fs.ensureDirSync(path.dirname(dataPath));
  fs.writeJsonSync(dataPath, data, { spaces: 2 });
}

function getMirrorTarget(sourceJid) {
  const mirrors = loadMirrors();
  return mirrors[sourceJid] || null;
}

function setMirror(sourceJid, targetJid) {
  const mirrors = loadMirrors();
  mirrors[sourceJid] = targetJid;
  saveMirrors(mirrors);
}

function removeMirror(sourceJid) {
  const mirrors = loadMirrors();
  delete mirrors[sourceJid];
  saveMirrors(mirrors);
}

function listMirrors() {
  return loadMirrors();
}

module.exports = { getMirrorTarget, setMirror, removeMirror, listMirrors };
