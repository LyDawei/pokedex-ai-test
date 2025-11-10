#!/bin/bash

# Pokédex AI Setup Script
# Automated setup for Mac development environment

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

# Banner
echo ""
echo "╔═══════════════════════════════════════╗"
echo "║   Pokédex AI - Setup Script          ║"
echo "║   Interactive Pokédex with AI TTS     ║"
echo "╚═══════════════════════════════════════╝"
echo ""

# Step 0: Validate we're in the project root
print_step "Validating project directory..."
if [ ! -f "package.json" ]; then
    print_error "package.json not found. Please run this script from the project root directory."
    exit 1
fi

if [ ! -f ".env.example" ]; then
    print_error ".env.example not found. This file is required for setup."
    exit 1
fi

print_success "Project directory validated"

# Step 1: Check Node.js version
print_step "Checking Node.js version..."
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    echo "Please install Node.js 22.x from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_warning "Node.js version $(node -v) detected. Recommended: v22.x"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    print_success "Node.js $(node -v) detected"
fi

# Step 2: Check npm version
print_step "Checking npm version..."
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi
print_success "npm $(npm -v) detected"

# Step 3: Install dependencies
print_step "Installing dependencies..."
if npm install; then
    print_success "Dependencies installed successfully"
else
    print_error "Failed to install dependencies"
    exit 1
fi

# Step 4: Setup environment variables
print_step "Setting up environment configuration..."

if [ -f .env ]; then
    print_warning ".env file already exists"
    read -p "Overwrite existing .env file? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_warning "Skipping .env setup"
        SKIP_ENV=true
    fi
fi

if [ "$SKIP_ENV" != true ]; then
    # Prompt for ElevenLabs API key
    echo ""
    echo "ElevenLabs API Key Setup"
    echo "------------------------"
    echo "This application uses ElevenLabs for text-to-speech functionality."
    echo "You can get your API key from: https://elevenlabs.io/app/settings/api-keys"
    echo ""

    read -p "Enter your ElevenLabs API key (or press Enter to skip): " ELEVENLABS_KEY

    if [ -z "$ELEVENLABS_KEY" ]; then
        print_warning "No API key provided. Copying .env.example to .env"
        cp .env.example .env
        chmod 600 .env
        print_warning "Please edit .env and add your ElevenLabs API key before running the app"
    else
        # Create .env file with provided API key (using echo to avoid process list exposure)
        echo "ELEVENLABS_API_KEY=$ELEVENLABS_KEY" > .env
        echo "ELEVENLABS_VOICE_ID=duIivFCQWvNj2G0O7aV2" >> .env
        chmod 600 .env
        print_success ".env file created with your API key (permissions: 600)"
    fi
fi

# Step 5: Run type checking
print_step "Running TypeScript type checking..."
if npm run check; then
    print_success "Type checking passed"
else
    print_error "Type checking failed"
    echo "You may need to fix type errors before running the app"
    read -p "Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Step 6: Build verification (optional)
print_step "Verifying build configuration..."
echo "Testing production build (this may take a moment)..."
if npm run build; then
    print_success "Build configuration verified"
else
    print_warning "Build failed, but development may still work"
fi

# Step 7: Setup complete
echo ""
echo "╔═══════════════════════════════════════╗"
echo "║   Setup Complete!                     ║"
echo "╚═══════════════════════════════════════╝"
echo ""
print_success "All setup steps completed successfully"
echo ""
echo "Next steps:"
echo "  1. Start the development server:"
echo "     ${GREEN}npm run dev${NC}"
echo ""
echo "  2. Open your browser to:"
echo "     ${BLUE}http://localhost:5173/projects/pokedex${NC}"
echo ""
echo "  3. For production build:"
echo "     ${GREEN}npm run build${NC}"
echo "     ${GREEN}npm run preview${NC}"
echo ""

# Step 8: Offer to start dev server
read -p "Start development server now? (Y/n): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Nn]$ ]]; then
    print_step "Starting development server..."
    echo ""
    npm run dev
else
    echo "Run ${GREEN}npm run dev${NC} when you're ready to start!"
fi
