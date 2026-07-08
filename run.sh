#!/bin/bash

# ANSI Color Codes
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting OSINT WhatsApp Bot Setup...${NC}"

# Check for node_modules
if [ ! -d "node_modules" ]; then
    echo -e "${GREEN}Installing dependencies...${NC}"
    npm install || { echo -e "${RED}Dependency installation failed!${NC}"; exit 1; }
fi

# Build the project
echo -e "${BLUE}Building the project...${NC}"
npm run build || { echo -e "${RED}Build failed! Please check tsconfig.json or source files.${NC}"; exit 1; }

# Check if .env exists
if [ ! -f ".env" ]; then
    echo -e "${GREEN}Creating .env from template...${NC}"
    cat > .env <<EOL
PORT=3000
DATABASE_URL=sqlite:./database.sqlite
JWT_SECRET=$(openssl rand -base64 32)
OWNER_NUMBER=1234567890@s.whatsapp.net
BOT_NAME=OSINT-Bot
PREFIX=.
LOG_LEVEL=info
EOL
fi

echo -e "${GREEN}Setup complete. Starting the bot...${NC}"
npm start
