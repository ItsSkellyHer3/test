# Professional OSINT WhatsApp Bot & Dashboard

A comprehensive WhatsApp management and Open-Source Intelligence (OSINT) platform built with Node.js and WhiskeySockets Baileys.

## Features

- **Real-time Web Dashboard**: Responsive Material Design 3 UI for monitoring and management.
- **Advanced OSINT Suite**: Commands for WHOIS, DNS, IP Geolocation, Tech detection, SSL analysis, and more.
- **Group Management**: Full control over group members and settings directly from the web.
- **Modular Command System**: Easy to extend with role-based permissions.
- **Secure Architecture**: JWT authentication, Bcrypt hashing, and Rate limiting.
- **Passive Owner Detection**: Specialized responses for primary administrators.

## Core OSINT Commands

- `.whois <domain>` - Domain registration data.
- `.dns <domain>` - DNS records.
- `.ip <ip/domain>` - Geolocation and ASN data.
- `.ssl <domain>` - SSL certificate details.
- `.tech <domain>` - Website technology stack detection.
- `.exif <image>` - Metadata extraction from images.
- `.hash <text>` - Generate multiple hash types.
- `.expand <url>` - Unshorten URLs.
- `.jwt <token>` - Decode JSON Web Tokens.

## Installation & Setup

### Prerequisites

- Node.js (v18+)
- npm
- Linux (Ubuntu/Debian/Mint), Windows, or macOS.

### Automated Setup

Run the provided setup script:

```bash
chmod +x run.sh
./run.sh
```

### Manual Setup

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Environment Configuration**:
   Create a `.env` file:
   ```env
   PORT=3000
   JWT_SECRET=your_secret_key
   PREFIX=.
   OWNER_NUMBER=96190322475148
   DATABASE_URL=sqlite:./database.sqlite
   ```

3. **Build the Project**:
   ```bash
   npm run build
   ```

4. **Start the Bot**:
   ```bash
   npm start
   ```

## Usage

1. Start the bot and scan the QR code in the terminal using WhatsApp.
2. Access the dashboard at `http://localhost:3000`.
3. Default login (first run only): `admin` / `admin`.
4. After login, you can execute OSINT tools from the web or directly in WhatsApp.

## Security

- Authentication: JWT-based sessions.
- Authorization: Role-based access (Owner, Admin, Moderator, etc.).
- Protection: Helmet headers, Rate limiting, and Input validation.

## License

MIT
