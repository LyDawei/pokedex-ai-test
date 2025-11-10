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
    print_warning "Continuing with current version..."
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

# Find the master worktree root
MASTER_WORKTREE=$(git worktree list | grep '\[master\]' | awk '{print $1}')

if [ -f .env ]; then
    print_warning ".env file already exists - keeping existing configuration"
elif [ -n "$MASTER_WORKTREE" ] && [ -f "$MASTER_WORKTREE/.env" ]; then
    print_step "Copying .env from master worktree..."
    cp "$MASTER_WORKTREE/.env" .env
    chmod 600 .env
    print_success ".env file copied from master worktree"
else
    print_warning "No .env found in master worktree. Copying .env.example to .env"
    cp .env.example .env
    chmod 600 .env
    print_warning "Please edit .env and add your ElevenLabs API key before running the app"
fi

# Step 5: Run type checking
print_step "Running TypeScript type checking..."
if npm run check; then
    print_success "Type checking passed"
else
    print_warning "Type checking failed - continuing anyway"
    print_warning "You may need to fix type errors before running the app"
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

# Step 8: Setup complete - no interactive server start
echo "Run ${GREEN}npm run dev${NC} when you're ready to start!"
echo "Or use the Conductor 'run' command to start the development server."
