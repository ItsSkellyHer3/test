# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-07-08

### Added
- **Core WhatsApp Connectivity**
    - Integrated WhiskeySockets Baileys for stable WhatsApp connection.
    - Automatic reconnection and multi-file session persistence.
    - Support for QR pairing and real-time event handling.
- **Modern Web Dashboard**
    - Material Design 3 inspired UI using Beer CSS.
    - Fully responsive layout (Desktop, Tablet, Mobile).
    - Real-time status monitoring (Uptime, Memory, Connection).
    - Grouped Chat Monitor with message history and real-time updates via Socket.IO.
    - Dedicated Group Management section for participating groups.
    - Light/Dark mode toggle.
- **Modular Command System**
    - Dynamic command loading from `src/commands`.
    - Role-based Permission System (OWNER, ADMIN, MODERATOR, VIEWER, GUEST).
- **OSINT & Utility Tools**
    - `.whois`: Domain WHOIS lookup.
    - `.ip`: IP address information.
    - `.dns`: DNS record lookup (A records).
    - `.headers`: HTTP header inspection.
    - `.hash`: Multi-algorithm text hashing (MD5, SHA1, SHA256).
    - `.anon`: Formatted anonymous messaging for administrators.
- **Persistence & Security**
    - SQLite database with Sequelize ORM for messages, users, and logs.
    - JWT-based API authentication.
    - Password hashing using Bcrypt.
    - Security headers with Helmet.
    - API Rate Limiting.
- **Documentation**
    - Comprehensive `README.md` with setup instructions.
    - Detailed `CHANGELOG.md`.

### Fixed
- Improved dashboard navigation to support mobile drawer and view switching.
- Resolved database synchronization issues during startup.
- Fixed command permission check logic.

### Technical Details
- **Primary Language:** TypeScript / Node.js
- **Database:** SQLite
- **Frontend:** Vanilla JS + Beer CSS
- **Communication:** REST API + Socket.IO
