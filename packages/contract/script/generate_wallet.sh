#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "$SCRIPT_DIR/../../../config.sh"
source "$SCRIPT_DIR/../common/wallet.sh"

dev_wallet

cat <<EOF
{
  "walletAddress": "$DEV_WALLET_ADDRESS",
  "privateKey": "$DEV_WALLET_PRIVKEY",
  "faucet": "$FAUCET_URL"
}
EOF
