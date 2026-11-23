#!/bin/zsh
# One-click: install deps, start the API, launch the Ceylon Weddings mobile app.
cd "$(dirname "$0")"
export PATH="/opt/homebrew/bin:/usr/local/bin:$HOME/.nvm/versions/node/$(ls $HOME/.nvm/versions/node 2>/dev/null | tail -1)/bin:$PATH"
set -e
echo "==> Checking tools"
command -v node >/dev/null || { echo "Node is not installed. Install from https://nodejs.org then run again."; read; exit 1; }
command -v pnpm >/dev/null || { corepack enable pnpm 2>/dev/null || npm i -g pnpm@10; }

echo "==> Installing packages (first run takes a few minutes)"
pnpm install

cd apps/mobile
echo "==> Aligning Expo native versions"
npx --yes expo install --fix || true
[ -f .env ] || cp .env.example .env
cd ../..

echo "==> Starting the API on :4000 (log: /tmp/cw-api.log)"
if ! curl -s http://localhost:4000/health >/dev/null; then
  (pnpm --filter @ceylonweddings/api dev > /tmp/cw-api.log 2>&1 &)
  for i in {1..60}; do curl -s http://localhost:4000/health >/dev/null && break; sleep 2; done
fi

cd apps/mobile
if xcrun simctl help >/dev/null 2>&1; then
  echo "==> Opening in the iPhone Simulator"
  npx expo start --ios
else
  echo "==> No Xcode simulator found. Install 'Expo Go' on your phone and scan the QR code below."
  echo "    (For a real phone, set EXPO_PUBLIC_API_URL in apps/mobile/.env to http://$(ipconfig getifaddr en0):4000)"
  npx expo start
fi
