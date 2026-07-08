#!/bin/bash

echo "Starting OSINT WhatsApp Bot Setup..."

# Check for node_modules
if [ ! -d "node_modules" ]; then
    echo "Installing dependencies..."
    npm install
fi

# Build the project
echo "Building the project..."
npm run build

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env from template..."
    cat > .env <<EOL
PORT=3000
DATABASE_URL=sqlite:./database.sqlite
JWT_SECRET=$(openssl rand -base64 32)
OWNER_NUMBER=1234567890
BOT_NAME=OSINT-Bot
PREFIX=.
LOG_LEVEL=info
EOL
fi

echo "Setup complete. Starting the bot..."
npm start
