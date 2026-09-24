#!/bin/sh
set -eu

pnpm --filter @ceylonweddings/database migrate:deploy
exec node apps/api/dist/main.js
