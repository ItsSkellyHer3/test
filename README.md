# Professional OSINT WhatsApp Bot

A professional WhatsApp bot built with Node.js and WhiskeySockets Baileys, featuring a modern web dashboard and OSINT utilities.

## Features
- **Modular Command System:** Easily add new commands.
- **OSINT Tools:** WHOIS, IP lookup, Hashing, and more.
- **Web Dashboard:** Real-time monitoring, status updates, and analytics.
- **Security:** JWT authentication, rate limiting, and helmet.
- **Persistence:** SQLite database with Sequelize ORM.

## Setup Instructions

### Prerequisites
- Node.js (v16+)
- npm

### Installation
1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file from the provided template.
4. Build the project:
   ```bash
   npm run build
   ```

### Running
- Development mode:
  ```bash
   npm run dev
   ```
- Production mode:
  ```bash
   npm start
   ```

## Dashboard
Access the dashboard at `http://localhost:3000`. Default credentials: `admin` / `admin`.

## OSINT Commands
- `.whois <domain>`
- `.ip <address>`
- `.hash <text>`
- `.anon <name> | <message>`
