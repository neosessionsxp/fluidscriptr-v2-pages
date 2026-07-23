#!/bin/bash
set -e
cd "$(dirname "$0")"
KEY="FSR-FOUNDER-BRUUPPKVNWQIAGKMV0TJ"

echo "=== 1/4 Deploying fluidscriptr-ai ==="
npx -y wrangler deploy

echo "=== 2/4 Setting master key on fluidscriptr-ai ==="
printf '%s' "$KEY" | npx -y wrangler secret put MASTER_LICENSE_KEY

echo "=== 3/4 Deploying fluidscriptr-license ==="
npx -y wrangler deploy license-worker.js --name fluidscriptr-license

echo "=== 4/4 Setting master key on fluidscriptr-license ==="
printf '%s' "$KEY" | npx -y wrangler secret put MASTER_LICENSE_KEY --name fluidscriptr-license

echo ""
echo "=== DONE — master key is live on both workers ==="
