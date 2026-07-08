# Professional OSINT WhatsApp Bot

A professional WhatsApp bot built with Node.js and WhiskeySockets Baileys, featuring a modern web dashboard and OSINT utilities.

## Features
- **Modular Command System:** Easily add new commands.
- **OSINT Tools:** WHOIS, DNS, IP, SSL, Exif, Tech detection, ASN, and more.
- **Web Dashboard:** Real-time monitoring, status updates, and analytics.
- **Security:** JWT authentication, bcrypt hashing, rate limiting, and helmet.
- **Persistence:** SQLite database with Sequelize ORM.
- **Responsive UI:** Modern Material Design 3 UI, mobile-friendly.

## Setup Instructions

### Installation (Linux/Debian/Mint)
1. Clone the repository.
2. Run the setup script:
   ```bash
   chmod +x run.sh
   ./run.sh
   ```

## OSINT Commands
- `.whois <domain>`
- `.dns <domain>`
- `.ip <address>`
- `.ssl <domain>`
- `.tech <url>`
- `.asn <ip>`
- `.exif` (reply to image)
- `.hash <text>`
- `.qrencode <text>`
- `.ping`
- `.help`

## Configuration
Update the `.env` file with your details.
Format for `OWNER_NUMBER`: `[countrycode][number]@s.whatsapp.net` (e.g., `1234567890@s.whatsapp.net`).
