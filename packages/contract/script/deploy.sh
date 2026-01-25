#!/bin/bash
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

source "$SCRIPT_DIR/../../../config.sh"

PRIVKEY=$1
CONTRACT_PATH="src/Counter.sol:Counter"

if [ -z "$PRIVKEY" ]; then
  echo "Missing private key" >&2
  exit 1
fi

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
