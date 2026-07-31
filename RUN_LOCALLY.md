# 💻 Local Setup & Activation Guide for Pookie Bot

This guide provides step-by-step instructions to set up, configure, pair, and run **Pookie Bot** on your local machine (Windows, macOS, or Linux).

---

## 📋 Table of Contents
1. [Prerequisites](#1-prerequisites)
2. [Installation Steps](#2-installation-steps)
3. [Configuration (.env & Settings)](#3-configuration-env--settings)
4. [First-Time Activation & Pairing Code](#4-first-time-activation--pairing-code)
5. [Running the Bot](#5-running-the-bot)
6. [Managing Session & State](#6-managing-session--state)
7. [Troubleshooting & FAQs](#7-troubleshooting--faqs)

---

## 1. Prerequisites

Before installing, ensure your local computer has the following software installed:

- **Node.js**: Version `18.0.0` or higher (LTS recommended). Download from [nodejs.org](https://nodejs.org/).
- **Git**: Installed and configured on your system. Download from [git-scm.com](https://git-scm.com/).
- **WhatsApp**: Installed on your mobile device with an active phone number.

To verify installation, open a terminal (Command Prompt, PowerShell, or Terminal) and run:
```bash
node -v
npm -v
git --version
```

---

## 2. Installation Steps

### Step 2.1: Clone or Navigate to the Repository
Open your terminal and navigate to the folder where Pookie Bot is located:

```bash
cd "C:\Users\SHABBIR TRADERS\Desktop\Bot\Panel Web\Whatsapp-bots\Pookie-Bot-master\Pookie-Bot-master"
```

### Step 2.2: Install Dependencies
Run `npm install` to download and install all required Node.js packages:

```bash
npm install
```

> [!TIP]
> If you encounter dependency conflict errors, install with the `--legacy-peer-deps` flag:
> ```bash
> npm install --legacy-peer-deps
> ```

---

## 3. Configuration (.env & Settings)

### Step 3.1: Configure Environment Variables (`.env`)
Create or edit the `.env` file in the root directory.

Example `.env` file content:
```env
BOT_NAME=POOKIE BOT
OWNER_NAME=Mughal Dev
GURU_API_KEY=guru
GIFTED_API_KEY=gifted
THUMBNAIL_URL=https://picsum.photos/seed/pookiebot/400/400
SMVD_KEY=5dc721e18cmsh0d6b0f2e1b1f59cp1e000ajsnedde84a4491a
```

### Step 3.2: Configure Bot Settings (`settings.json`)
The `settings.json` file controls bot behavior parameters:
```json
{
    "antidelete": "on",
    "public_mode": true,
    "hidden_categories": [
        "downloader"
    ]
}
```

- **antidelete**: Controls deleted message recovery (`"on"` / `"off"`).
- **public_mode**: Allows anyone to use commands (`true`) or restricts to owner (`false`).

---

## 4. First-Time Activation & Pairing Code

Pookie Bot uses Baileys Direct Pairing Code authentication (no QR code scanning required).

### Step 4.1: Start the Pairing Process
Run the start script in your terminal:
```bash
npm start
```

### Step 4.2: Enter Phone Number
1. The terminal will display:
   ```text
   --- POOKIE BOT (Direct Baileys) ---
   Please enter your WhatsApp number (with country code, e.g., 923001234567):
   ```
2. Enter your full WhatsApp phone number without `+`, spaces, or dashes (e.g., `923001234567` or `14155552671`).
3. Press **Enter**.

### Step 4.3: Enter Pairing Code on Phone
1. An 8-digit code will appear in your terminal (e.g., `ABCD-1234`).
2. Open WhatsApp on your phone.
3. Go to **Settings** > **Linked Devices**.
4. Tap **Link a Device**.
5. Select **Link with phone number instead** at the bottom of the screen.
6. Enter the 8-digit code shown in the terminal.
7. Once verified, the terminal will show:
   ```text
   ✅ POOKIE BOT Connected Successfully!
   ```

---

## 5. Running the Bot

Once paired, the credentials are saved in the `session/` folder.

To launch the bot anytime:
```bash
npm start
```
or
```bash
node index.js
```

---

## 6. Managing Session & State

- **Session Directory**: Authentication keys are stored in `./session/`.
- **Re-pairing**: If your session expires or becomes corrupted, delete the `session` directory and restart the bot:
  ```bash
  # Windows PowerShell
  Remove-Item -Recurse -Force session
  npm start
  ```
  ```bash
  # Linux/macOS
  rm -rf session
  npm start
  ```

---

## 7. Troubleshooting & FAQs

> [!WARNING]
> **ISP / Connection Errors (EHOSTUNREACH or ETIMEDOUT)**
> Pookie Bot includes automatic DNS overrides (`8.8.8.8`, `1.1.1.1`). If connection fails, ensure your firewall permits Node.js outbound traffic.

> [!NOTE]
> **Node-Cache / Suppressed Noise Warnings**
> Pookie Bot suppresses Baileys internal signal noise to keep terminal logs clean. If you need debug logs, edit `index.js` logger level from `"silent"` to `"info"`.
