# API Documentation

Base URL: `http://localhost:3000` (or `http://YOUR_VPS_IP:3000`)

## Standard Response Format

**Success:**
```json
{
  "success": true,
  "data": {
    ...
  }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "Human readable error message"
  }
}
```

---

## Endpoints

### 1. Start Session / Generate Wallet

Generates a new temporary developer wallet and creates a session.

- **URL:** `/api/start`
- **Method:** `POST`
- **Body:** None

**Success Response:**
```json
{
  "success": true,
  "data": {
    "sessionId": "550e8400-e29b-41d4-a716-446655440000",
    "walletAddress": "0x123...",
    "privateKey": "0xabc...",
    "faucet": "https://faucet..."
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": {
    "code": "WALLET_GEN_FAILED",
    "message": "Failed to generate wallet"
  }
}
```

---

### 2. Deploy Contract

Deploys the contract using the wallet generated in the start session step.

- **URL:** `/api/deploy`
- **Method:** `POST`
- **Body:**
```json
{
  "sessionId": "550e8400-e29b-41d4-a716-446655440000"
}
```

**Success Response:**
```json
{
  "success": true,
  "data": {
    "walletAddress": "0x123...",
    "contractAddress": "0x456...",
    "contractLink": "https://explorer..."
  }
}
```

**Error Responses:**

*   **Session Not Found:**
    ```json
    {
      "success": false,
      "error": {
        "code": "SESSION_NOT_FOUND",
        "message": "Session not found"
      }
    }
    ```

*   **Deployment Failed:**
    ```json
    {
      "success": false,
      "error": {
        "code": "DEPLOY_FAILED",
        "message": "Deployment failed. Check server logs."
      }
    }
    ```
