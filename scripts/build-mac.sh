#!/bin/bash
# ──────────────────────────────────────────────────────────────
# Aero Atlas — Terminal Time  |  macOS Build Script
# Produces: dist/Aero Atlas — Terminal Time-1.0.0.dmg
# ──────────────────────────────────────────────────────────────
set -e

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  Aero Atlas — Terminal Time Builder    ║"
echo "║  macOS DMG                             ║"
echo "╚════════════════════════════════════════╝"
echo ""

# ── 1. Check Node.js ──────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "✗ Node.js not found."
  echo "  Install from: https://nodejs.org (LTS version)"
  exit 1
fi

NODE_VER=$(node -v)
echo "✓ Node.js $NODE_VER"

# ── 2. Check Python + Pillow for icon generation ──────────────
if command -v python3 &>/dev/null; then
  if python3 -c "import PIL" &>/dev/null; then
    echo "✓ Pillow available — generating icons..."
    python3 scripts/generate_icons.py
  else
    echo "⚠  Pillow not installed. Skipping icon generation."
    echo "   Run: pip3 install Pillow --break-system-packages"
    echo "   Then re-run this script, OR add your own icon files:"
    echo "     build-resources/icon.icns"
    echo "     build-resources/icon.ico"
  fi
else
  echo "⚠  Python3 not found. Skipping icon generation."
fi

# ── 3. Install dependencies ───────────────────────────────────
echo ""
echo "→ Installing dependencies..."
npm install

# ── 4. Build DMG ─────────────────────────────────────────────
echo ""
echo "→ Building macOS DMG (Intel + Apple Silicon)..."
npm run build:mac

echo ""
echo "╔════════════════════════════════════════╗"
echo "║  ✓ Build complete!                     ║"
echo "╚════════════════════════════════════════╝"
echo ""
echo "Output files in ./dist/"
ls -lh dist/*.dmg 2>/dev/null || echo "(check dist/ folder)"
echo ""
echo "Upload the .dmg file to Gumroad."
