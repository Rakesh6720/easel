#!/bin/bash

# Script to start the frontend with the correct Node.js version
# This ensures we use Node.js 22.16.0 which is required by Next.js

echo "Starting Easel Frontend with Node.js 22.16.0..."

# Source NVM and use the correct Node version
source ~/.nvm/nvm.sh
nvm use 22.16.0

# Start the development server
npm run dev
