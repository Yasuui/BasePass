BasePass Development Guide for Cursor AI
This Markdown document provides a comprehensive guide for developing "BasePass — Onchain Event Passport," an Ethereum-based dApp on the Base network. It is designed as a reference for Cursor AI to assist in code generation, refactoring, and debugging during the development process. The MVP targets a hackathon submission by November 1, 2025.
The project uses Solidity for smart contracts, React/Next.js for the frontend, ethers.js or wagmi for wallet interactions, and deploys to Base Sepolia testnet. Hosting is on Vercel. Key focuses: technical correctness (smart contracts + signature verification), originality (onchain passport + signed QR flow), usability (simple UX), and growth (event plugin potential).
Feasible for a solo developer using Cursor AI + ChatGPT for code assistance and presentation help. Assume a monorepo structure with folders like /contracts, /frontend, /scripts, and /test.
Project Overview

One-Line Pitch: Build an onchain "passport" NFT that attendees mint once; event operators issue signed QR codes for claiming stamps—proof of attendance stored onchain with a polished UI.
Why This Idea?

Highly demoable: Mint → Scan QR → Onchain stamp in real-time.
Aligns with hackathon criteria: Technical (contracts + sigs), original, usable, growth-oriented.


MVP Scope:

Must-Haves: Passport NFT minting, admin event creation + QR signing, claim flow with sig verification, passport viewer UI.
Deployed on Base Sepolia testnet; frontend on Vercel.
Short test suite for core functions.



Requirements
Functional Requirements

Passport NFT (ERC-721):

Users mint one passport per wallet (UI warns against multiples for MVP).
Metadata: Basic JSON (e.g., name: "BasePass Passport", image: placeholder SVG or IPFS URL).
Stamp Storage: mapping(uint256 => mapping(uint256 => bool)) public stamps; (tokenId → eventId → claimed).


Event Creation and Signing (Admin UI):

Any connected wallet can create events (no auth for MVP).
Create Event: Inputs (name, description, icon URL) → generates eventId (auto-increment).
Signed QR: Operator signs payload {eventId, nonce, expiration, chainId} using ECDSA or EIP-712.

QR encodes JSON: {payload, signature}.
Nonce prevents replays; expiration adds security.




Claim Flow:

Scan QR → Decode JSON → Connect wallet → Claim tx.
Contract: Verify sig matches event signer, check nonce/expiration/not claimed, set stamp.
UI: Mobile-friendly with QR scanner integration.


Passport Viewer:

List owned passports (tokenIds).
Display stamps as icons/grid with event metadata.
Fetch data via contract queries.


Security Features:

Onchain sig verification.
Replay protection via nonces (e.g., mapping(bytes32 => bool) usedNonces;).
Use OpenZeppelin for ERC-721, ECDSA, ReentrancyGuard.



Non-Functional Requirements

Tech Stack:

Contracts: Solidity 0.8.x, Hardhat (dev/test/deploy), OpenZeppelin.
Frontend: Next.js (TypeScript), Tailwind CSS, wagmi/viem (wallet/chain), qrcode.react (QR gen), @zxing/library or similar (QR scan).
Other: Vercel hosting, Base Sepolia (chainId 84532), Alchemy/Infura RPC.


Usability: Simple, one-click flows; error handling (e.g., "Invalid signature"); responsive design.
Testing: Hardhat/Chai unit tests (5-10 covering mint, create, claim, failures).
Scope Limits: No server backend; client-side signing; basic metadata; testnet only.
Growth Hooks: Onchain event metadata; JS snippet for QR integration in other apps.