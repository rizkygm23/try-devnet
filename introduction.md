# 🌋 Seismic Devnet Playground

**Experience the future of on-chain privacy.**

This project is a **Devnet Playground** designed to lower the barrier to entry for developers and users interested in **Seismic Systems**. It provides a seamless, hands-on interface to interact with the Seismic Devnet without the complexity of setting up a local environment manually.

## 🌟 What is this?

The **Seismic Devnet Playground** is a web-based tool that allows you to:
1.  **Generate a Developer Wallet**: Instantly create a temporary wallet compatible with the Seismic network.
2.  **Fund Your Wallet**: Direct access to the official Faucet to claim testnet ETH.
3.  **Deploy Smart Contracts**: One-click deployment simulation to experience the speed and efficiency of the Seismic chain.
4.  **Verify on Explorer**: Real-time verification of your deployed contracts on the Seismic Block Explorer.

## 🛡️ Powered by Seismic

This playground highlights the core value proposition of Seismic:
*   **Protocol-Level Encryption**: Seismic embeds privacy directly into the chain architecture.
*   **Shielded Applications**: enabling "Smart Contracts that can keep secrets."
*   **Hardware Security**: Utilizes secure enclaves (Intel TDX) to protect data even during computation.

## 🚀 How It Works (User Journey)

The website guides you through a simple 4-step process:

1.  **Start Simulation**: The backend CLI generates a fresh EVM wallet for you.
2.  **Fund**: You receive your address and private key (for dev use). You must fund this address via the provided faucet link.
3.  **Deploy**: Once funded, the system runs a deployment script to launch a sample smart contract (e.g., `Counter.sol`) onto the Seismic Devnet.
4.  **Success**: You receive the contract address and a direct link to view your transaction on the block explorer.

## 💻 Tech Stack

*   **Frontend**: Next.js 15 (App Router), Tailwind CSS v4, Lucide Icons.
*   **Backend**: Node.js/Express (acting as a bridge to the CLI tools).
*   **Blockchain Tools**: Foundry (`cast`, `forge`) for wallet management and contract deployment.
*   **Design**: Custom "Glassmorphism" UI using the official Seismic Brand Kit (Deep Purple, Mauve, Gold).

---

> **Note**: This tool is for **educational and testing purposes only**. The wallets generated are temporary and should not be used for mainnet assets.
