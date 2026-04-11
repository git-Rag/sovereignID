# SovereignID — Copilot Instructions

## Project Overview

**SovereignID** is a React + Vite Progressive Web App that gives stateless refugees a permanent, self-sovereign digital identity. The identity is:
- **Anchored on Bitcoin** via the ION protocol (permanent, censorship-resistant)
- **Recovered via community trust** — 5 guardians hold Shamir key shares; any 3 can recover
- **Verified privately** — ZK proofs let users prove facts without revealing data
- **Synced offline** — nearby devices exchange updates over Bluetooth

## Stack

- React + Vite (PWA, service worker, offline-first)
- ion-tools → DID:ION anchoring
- face-api.js → In-browser face embedding
- secrets.js → SLIP-0039 Shamir Secret Sharing
- snarkjs + Circom → Groth16 ZK proofs
- IndexedDB + AES-GCM → Encrypted local storage
- Web Bluetooth API → Peer-to-peer offline sync
- Pinata API → IPFS DID document hosting
- Circle SDK → USDC wallet

## Hard Rules — Never Break These

1. **Private keys never touch application memory** — Use Web Crypto API with `extractable: false`
2. **No raw biometric data stored anywhere** — Only SHA-256 hash of face embedding
3. **No PII on-chain or IPFS** — DID document contains only: public key, biometric commitment, endpoints
4. **Shamir shares never transmitted digitally** — Display as 20-word mnemonics for manual transcription only
5. **All Bluetooth payloads use AES-GCM authenticated encryption**
6. **Every core flow works with zero internet** — Enrollment, verification, recovery, credential presentation
7. **No analytics or telemetry without explicit user consent**

## Performance Targets (Enforce in Code)

| Operation | Target |
|---|---|
| Full enrollment (no internet) | < 90 seconds |
| Face embedding computation | < 3 seconds (Snapdragon 450) |
| DID document generation | < 500ms |
| ZK age proof generation | < 5 seconds |
| Offline identity verification | < 10 seconds |
| Social recovery (3 guardians, offline) | < 10 minutes |
| Bluetooth peer discovery | < 15 seconds within 10m |
| App cold start → enrollment-ready | < 8 seconds |

## Project Structure

```
src/
  core/
    did/          → DID generation, anchoring, resolution
    biometric/    → face-api.js embedding + SHA-256 hash
    recovery/     → Shamir split/reconstruct, guardians
    credentials/  → W3C VC issuance, storage, disclosure
    zk/           → snarkjs age proof generation
  sync/
    bluetooth/    → Web Bluetooth peer discovery + gossip
    queue/        → Offline operation queue (IndexedDB)
  wallet/
    usdc/         → Circle SDK integration
    bridge/       → USDC → M-Pesa / bKash conversion
  ui/
    enrollment/   → Face scan → guardian setup → DID creation
    recovery/     → QR-based recovery + guardian approval
    credentials/  → Credential wallet, ZK proof presentation
    wallet/       → Balance, aid receipt, withdrawal
  lib/
    storage.ts    → AES-GCM encrypted IndexedDB wrapper
    serviceWorkerRegister.ts → SW lifecycle
  hooks/
    useOnline.ts  → Connectivity tracking hook
```

## TODO Comments in Code

When adding open decisions, use these TODO patterns:

- `// TODO: NFC vs Bluetooth — NFC has broader support on basic Android, shorter range`
- `// TODO: Minimum issuer threshold — 1 for MVP, 2+ for high-stakes credentials?`
- `// TODO: Guardian incentive mechanism — small USDC fee for recovery responses?`
- `// TODO: Bluetooth-synced data retention policy for third-party refugee data`
- `// TODO: Voluntary identity deactivation flow on resettlement`

## Build Order

1. ✅ **Scaffold** — Vite PWA config, service worker, offline detection, routing shell
2. **DID core** — ion-tools key generation, DID document, IPFS upload, cache
3. **Biometrics** — face-api.js flow, SHA-256 hash, biometric binding
4. **Recovery** — secrets.js 3-of-5 Shamir, guardian phrases, QR initiation
5. **Credentials** — W3C VC issuance, wallet, snarkjs ZK proofs, QR presentation
6. **Bluetooth sync** — peer discovery, authenticated gossip, aid worker hub
7. **Wallet** — USDC balance, airdrop mock, M-Pesa conversion UI

## Environment Setup

**Before proceeding to task 2 (DID core), I need:**

1. **Pinata API Key** (for IPFS DID document hosting)
2. **Circle API Key** (for USDC wallet integration)
3. **Bitcoin Network** (testnet or mainnet for ion-tools anchoring)

Once provided, I will update `src/config.ts` with these credentials (stored safely in environment).

## Development Commands

```bash
npm install      # Install dependencies
npm run dev      # Start dev server (http://localhost:5173)
npm run build    # Build for production
npm run preview  # Preview production build
```

## Next Steps

1. Provide API keys for Pinata, Circle, and Bitcoin network config
2. Proceed with **Task 2: DID Core** (ion-tools integration)
3. Follow the build order strictly — each task depends on prior layers

---

**Ready to begin?** Ask for Task 2: DID Core, or provide external API credentials.
