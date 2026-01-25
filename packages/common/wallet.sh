#!/bin/bash

# DEVNET ONLY
# Do NOT use this wallet generation in production

dev_wallet() {
    if ! command -v cast >/dev/null 2>&1; then
        echo "Error: cast not found. Install Foundry first." >&2
        exit 1
    fi

    local keypair_json
    keypair_json=$(cast wallet new --json)

    # cast returns ARRAY, not object
    DEV_WALLET_ADDRESS=$(echo "$keypair_json" | jq -r '.[0].address')
    DEV_WALLET_PRIVKEY=$(echo "$keypair_json" | jq -r '.[0].privateKey')

    if [ -z "$DEV_WALLET_ADDRESS" ] || [ "$DEV_WALLET_ADDRESS" = "null" ]; then
        echo "Failed to generate dev wallet" >&2
        exit 1
    fi
}
