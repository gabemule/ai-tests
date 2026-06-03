#!/bin/bash
# setup.sh — Initialize development environment

set -e

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VENV_DIR="$PROJECT_DIR/.venv"

echo "=== Similarity Score — Setup ==="

# Check if venv exists
if [ -d "$VENV_DIR" ]; then
    echo "✓ Virtual environment already exists at $VENV_DIR"
else
    echo "Creating virtual environment at $VENV_DIR..."
    python3 -m venv "$VENV_DIR"
    echo "✓ Virtual environment created"
fi

# Activate venv
echo "Activating virtual environment..."
source "$VENV_DIR/bin/activate"

# Upgrade pip
echo "Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "Installing dependencies..."
pip install -e ".[dev]"

echo ""
echo "✓ Setup complete!"
echo ""
echo "To activate the virtual environment, run:"
echo "  source .venv/bin/activate"
echo ""
echo "Available commands (see Makefile):"
echo "  make run     — Start the API server"
echo "  make test    — Run tests"
echo "  make lint    — Run linter"
echo "  make format  — Format code"
echo "  make clean   — Clean up generated files"