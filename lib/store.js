const fs = require("fs-extra");
const path = require("path");

const STORE_FILE = path.join(process.cwd(), "database", "store.json");

// Ensure directory exists
if (!fs.existsSync(path.dirname(STORE_FILE))) {
  fs.mkdirSync(path.dirname(STORE_FILE), { recursive: true });
}

// Load store
let storeData = {};
if (fs.existsSync(STORE_FILE)) {
  try {
    storeData = fs.readJsonSync(STORE_FILE);
  } catch (e) {
    console.error("Failed to load store:", e);
    storeData = {};
  }
}

const save = () => {
  fs.writeJsonSync(STORE_FILE, storeData, { spaces: 2 });
};

module.exports = {
  async saveSetting(type, id, data) {
    if (!storeData[type]) storeData[type] = {};
    storeData[type][id] = data;
    save();
    return true;
  },

  async getSetting(type, id) {
    if (!storeData[type]) return null;
    return storeData[type][id] || null;
  },

  async incrementMessageCount(chatId, userId) {
    if (!storeData["messageCounts"]) storeData["messageCounts"] = {};
    if (!storeData["messageCounts"][chatId]) storeData["messageCounts"][chatId] = {};
    if (!storeData["messageCounts"][chatId][userId]) storeData["messageCounts"][chatId][userId] = 0;

    storeData["messageCounts"][chatId][userId] += 1;
    save();
    return true;
  },

  async getAllMessageCounts() {
    return { messageCount: storeData["messageCounts"] || {} };
  },

  async setTheme(userId, themeId) {
    if (!storeData["themes"]) storeData["themes"] = {};
    storeData["themes"][userId] = themeId;
    save();
    return true;
  },

  async getTheme(userId) {
    if (!storeData["themes"]) return "1"; // Default to theme 1
    return storeData["themes"][userId] || "1";
  }
};
