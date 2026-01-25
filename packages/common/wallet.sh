#!/bin/bash

source ../../config.sh
source ../common/print.sh



# DEVNET ONLY
# Do NOT use this wallet generation in production

check_balance() {
    local address=$1

    local balance_json=$(curl -s -X POST "$RPC_URL" \
        -H "Content-Type: application/json" \
        -d '{
            "jsonrpc":"2.0",
            "method":"eth_getBalance",
            "params":["'"$address"'", "latest"],
            "id":1
        }')

    local hex_result=$(echo "$balance_json" | jq -r .result)

    if [ -z "$hex_result" ] || [ "$hex_result" = "0x0" ]; then
        return 1
    fi

    return 0
}

dev_wallet() {
    if ! command -v cast >/dev/null 2>&1; then
        echo "Error: cast not found. Install Foundry first." >&2
        exit 1
    fi

    local keypair_json
    keypair_json=$(cast wallet new --json)

    DEV_WALLET_ADDRESS=$(echo "$keypair_json" | jq -r .address)
    DEV_WALLET_PRIVKEY=$(echo "$keypair_json" | jq -r .privateKey)

    if [ -z "$DEV_WALLET_ADDRESS" ] || [ "$DEV_WALLET_ADDRESS" = "null" ]; then
        echo "Failed to generate dev wallet" >&2
        exit 1
    fi
}
