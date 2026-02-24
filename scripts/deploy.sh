#!/bin/bash
# Eseguito sulla VPS (manualmente o da GitHub Actions)
# Uso: ./scripts/deploy.sh

set -e
cd "$(dirname "$0")/.."
PARADISO_ROOT="${PARADISO_ROOT:-$PWD}"

cd "$PARADISO_ROOT"
echo ">>> Pull da Git..."
git fetch origin
git reset --hard origin/main

echo ">>> Backend: install e restart..."
cd backend
npm ci --omit=dev
cd ..
pm2 restart paradiso-api 2>/dev/null || (cd backend && pm2 start index.js --name paradiso-api)

echo ">>> Frontend: build e restart..."
cd frontend
npm ci
npm run build
cd ..
pm2 restart paradiso-web 2>/dev/null || (cd frontend && pm2 start "npx serve -s dist -l 3000" --name paradiso-web)

pm2 save
echo ">>> Deploy completato."
