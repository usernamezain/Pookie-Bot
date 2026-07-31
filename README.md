# 🤖 POOKIE BOT — WhatsApp Automation Bot

[![Node.js Version](https://img.shields.io/badge/Node.js-v18%2B-brightgreen.svg)](https://nodejs.org/)
[![Library](https://img.shields.io/badge/Baileys-v6.6.0-blue.svg)](https://github.com/WhiskeySockets/Baileys)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

**Pookie Bot** is a high-performance, modular WhatsApp automation bot built with Node.js and `@whiskeysockets/baileys`. It features direct 8-digit **Pairing Code Authentication** (no QR code scanning required), extensive media downloading tools, group management features, auto-response capabilities, anti-delete message recovery, and custom plugin support.

---

## 📚 Documentation & Step-by-Step Guides

For full detailed setup, activation, and 24/7 server hosting instructions, check out the dedicated step-by-step documentation:

- 💻 **[Local Setup & Activation Guide](file:///C:/Users/SHABBIR%20TRADERS/Desktop/Bot/Panel%20Web/Whatsapp-bots/Pookie-Bot-master/Pookie-Bot-master/RUN_LOCALLY.md)** (`RUN_LOCALLY.md`)
  *Complete guide to install, configure environment variables, pair via phone number, and run locally on Windows, macOS, or Linux.*

- 🚀 **[24/7 VPS & Railway Hosting Guide](file:///C:/Users/SHABBIR%20TRADERS/Desktop/Bot/Panel%20Web/Whatsapp-bots/Pookie-Bot-master/Pookie-Bot-master/HOSTING_GUIDE.md)** (`HOSTING_GUIDE.md`)
  *Detailed step-by-step instructions to host Pookie Bot 24/7 on Linux VPS servers (using PM2) or on Railway cloud platform with persistent session storage.*

---

## ✨ Features & Plugin Modules

Pookie Bot is structured around a modular plugin engine:

### 📥 Media & Downloader Suite
- **Video & Audio Downloaders**: YouTube (Audio/Video), TikTok (No Watermark), Instagram (Reels/Posts), Facebook HD, Dailymotion, Twitter/X.
- **Cloud & File Services**: Google Drive, Mega.nz direct downloader, Pastebin extractor, Git repository cloner.
- **Music & Photos**: Spotify track downloader, SoundCloud audio scraper, Pinterest image search, iStock waterless downloader, DramaDash.

### 👥 Group Administration & Analytics
- **Anti-Link Shield**: Automatically detects and handles unauthorized links in group chats.
- **Member Ranking & Leaderboard**: Tracks active message counts per user and ranks top group contributors.
- **Tagging & Mentions**: Mass mention/tagall tools for group announcements.
- **Group Intelligence**: View member metadata, join dates, and group administration logs.

### 👑 Owner & Administration Tools
- **Auto-React & Auto-Run**: Automated reaction triggers and command scheduler polling.
- **Chat Mirroring & Logging**: Sync and log active group/private messages.
- **Ghost Watch & Online Tracker**: Track online presence and last seen state.
- **Bot Customization**: Change profile picture via URL (`setppurl`), view runtime variables, restart bot remotely.

### 🔎 Search & Lookup Capabilities
- **Search Engines**: Wikipedia lookup, Google Image search (`g-i-s`), SodEom engine.
- **Stalking Tools**: Social profile inspection, user metadata lookup.

### 🛠️ Utilities & Helpers
- **Math Engine**: Evaluate complex mathematical expressions powered by `mathjs`.
- **User & ID Tools**: Fetch user JIDs, random fake user generator, high-res PFP downloader, URL shortener via Microlink, personal notepad.

### 🛡️ Anti-Delete Message Recovery
- Monitors incoming deleted messages and media in real-time, archiving revokes directly to owner or specified log channels (`settings.json`).

---

## ⚡ Quick Start Summary

### 1. Requirements
- **Node.js**: `v18.0.0` or higher
- **Git** & **npm**

### 2. Quick Run Commands
```bash
# Clone the repository
git clone https://github.com/usernamezain/Pookie-Bot.git
cd Pookie-Bot

# Install dependencies
npm install

# Start the bot & pair with WhatsApp
npm start
```

For full setup instructions, see **[RUN_LOCALLY.md](file:///C:/Users/SHABBIR%20TRADERS/Desktop/Bot/Panel%20Web/Whatsapp-bots/Pookie-Bot-master/Pookie-Bot-master/RUN_LOCALLY.md)**.

---

## ⚙️ Configuration Reference

### `.env` File
Create a `.env` file in the root directory:
```env
BOT_NAME=POOKIE BOT
OWNER_NAME=Mughal Dev
GURU_API_KEY=guru
GIFTED_API_KEY=gifted
THUMBNAIL_URL=https://picsum.photos/seed/pookiebot/400/400
SMVD_KEY=5dc721e18cmsh0d6b0f2e1b1f59cp1e000ajsnedde84a4491a
```

### `settings.json` File
```json
{
    "antidelete": "on",
    "public_mode": true,
    "hidden_categories": [
        "downloader"
    ]
}
```

---

## 📁 Repository Directory Structure

```text
Pookie-Bot/
├── config.js              # Central bot configuration loader
├── index.js               # Main entry point & Baileys connection engine
├── handler.js             # Command dispatcher & plugin loader
├── settings.json          # Bot behavior rules & switches
├── .env                   # API keys and environment variables
├── RUN_LOCALLY.md         # Detailed local setup & activation guide
├── HOSTING_GUIDE.md       # VPS & Railway 24/7 hosting guide
├── lib/                   # Internal libraries (autorun, store, tracker, etc.)
├── database/              # Persistent JSON store data
├── session/               # WhatsApp multi-device authentication credentials
└── plugins/               # Command plugins folder
    ├── developer/
    ├── downloader/
    ├── fun/
    ├── group/
    ├── media/
    ├── owner/
    ├── search/
    ├── stalk/
    └── utility/
```

---

## 👤 Author & License

- **Author**: Zain Mughal
- **License**: [MIT](LICENSE)
