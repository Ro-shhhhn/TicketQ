#!/bin/bash

echo "Setting up TicketQ..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo " Node.js is not installed. Please install Node.js first."
    exit 1
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo " Docker is not installed. Please install Docker first."
    exit 1
fi

echo " Node.js and Docker are installed"

# Install root dependencies
echo " Installing root dependencies..."
npm install

# Install client dependencies
echo " Installing client dependencies..."
cd client && npm install && cd ..

# Install server dependencies  
echo " Installing server dependencies..."
cd server && npm install && cd ..

# Create .env if it doesn't exist
if [ ! -f .env ]; then
    echo "  Creating .env file..."
    cp .env.example .env
fi

echo " Setup complete!"
echo ""
echo " Next steps:"
echo "1. Run 'npm run docker:up' to start with Docker"
echo "2. Or run 'npm run dev' for local development"
echo "3. Visit http://localhost:3000 for the frontend"
echo "4. API will be available at http://localhost:5000"