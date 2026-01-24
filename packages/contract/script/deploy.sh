#!/bin/bash
set -e

source ../../../config.sh

PRIVKEY=$1
CONTRACT_PATH="src/Counter.sol:Counter"

deploy_output=$(sforge create \
  --rpc-url "$RPC_URL" \
  --private-key "$PRIVKEY" \
  --broadcast \
  "$CONTRACT_PATH" \
  --constructor-args 5)

contract_address=$(echo "$deploy_output" | awk '/Deployed to:/ {print $3}')

cat <<EOF
{
  "contractAddress": "$contract_address",
  "contractLink": "$EXPLORER_URL/address/$contract_address"
}
EOF
