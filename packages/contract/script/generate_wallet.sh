#!/bin/bash
set -e

source ../../../config.sh
source ../common/wallet.sh

dev_wallet

cat <<EOF
{
  "walletAddress": "$DEV_WALLET_ADDRESS",
  "privateKey": "$DEV_WALLET_PRIVKEY",
  "faucet": "$FAUCET_URL"
}
EOF
