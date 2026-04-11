# SovereignID

A React + Vite Progressive Web App that gives stateless refugees a permanent, self-sovereign digital identity.

## What This App Does

**SovereignID** lets a displaced person with no documents create a cryptographic digital identity on their phone — fully offline, with no government or NGO owning the data. The identity is:

- **Anchored on Bitcoin** via the ION protocol (permanent, censorship-resistant)
- **Recovered via community trust** — 5 guardians hold Shamir key shares; any 3 can recover the identity
- **Verified privately** — ZK proofs let users prove specific facts (e.g., "I am over 18") without revealing any other data
- **Synced offline** — nearby devices exchange updates over Bluetooth without internet

## Tech Stack

```
React + Vite (PWA, service worker, offline-first)
ion-tools          → DID:ION key generation and anchoring
face-api.js        → In-browser face embedding (TFLite)
secrets.js         → SLIP-0039 Shamir Secret Sharing
snarkjs + Circom   → Pre-compiled Groth16 ZK age proof circuits
IndexedDB          → Encrypted local credential storage
W3C Verifiable Credentials → Credential issuance and presentation
Web Bluetooth API  → Peer-to-peer offline sync
Pinata API         → IPFS for DID document hosting
Circle SDK (USDC)  → Stablecoin wallet keyed to DID
```

## Hard Rules

1. **Private keys never touch application memory** — Use Web Crypto API with `extractable: false`
2. **No raw biometric data stored anywhere** — Only SHA-256 hash of face embedding
3. **No PII on-chain or IPFS** — DID document contains only: public key, biometric commitment, service endpoints
4. **Shamir shares are never transmitted digitally** — Display as 20-word mnemonics on screen for manual transcription only
5. **All Bluetooth payloads use AES-GCM authenticated encryption**
6. **Every core flow works with zero internet** — Enrollment, verification, recovery, credential presentation — all offline
7. **No analytics or telemetry without explicit user consent**

## Performance Targets

| Operation | Target |
|---|---|
| Full enrollment (no internet) | < 90 seconds |
| Face embedding computation | < 3 seconds (Snapdragon 450-class) |
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
    recovery/     → Shamir split/reconstruct, guardian flow
    credentials/  → W3C VC issuance, storage, selective disclosure
    zk/           → snarkjs age proof generation and verification
  sync/
    bluetooth/    → Web Bluetooth peer discovery + gossip protocol
    queue/        → Offline operation queue (IndexedDB)
  wallet/
    usdc/         → Circle SDK integration, balance, transaction history
    bridge/       → USDC → M-Pesa / bKash conversion flow
  ui/
    enrollment/   → Face scan → guardian setup → DID creation flow
    recovery/     → QR-based recovery initiation + guardian approval
    credentials/  → Credential wallet, ZK proof presentation
    wallet/       → Balance display, aid receipt, withdrawal
  lib/
    crypto.ts     → AES-GCM encryption helpers
    storage.ts    → Encrypted IndexedDB wrapper
    queue.ts      → Persistent offline operation queue
  hooks/
    useOnline.ts  → Connectivity tracking hook
```

## Getting Started

### Prerequisites

- Node.js 16+
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

## Configuration

**Required API Keys** (set as environment variables in `.env.local`):

```env
VITE_PINATA_API_KEY=<your-pinata-api-key>
VITE_PINATA_JWT=<your-pinata-jwt>
VITE_CIRCLE_API_KEY=<your-circle-api-key>
VITE_BITCOIN_NETWORK=testnet  # or mainnet
```

See `.env.example` for all available options.

## Security

This app handles sensitive cryptographic operations. All private keys are protected using the Web Crypto API with `extractable: false`. Biometric data is never stored; only SHA-256 hashes are persisted. All encryption uses authenticated AES-GCM mode.

**Do not deploy to production without security audits.**

## Roadmap

- [ ] Task 1: ✅ Scaffold Vite PWA, service worker, offline detection, routing
- [ ] Task 2: DID core (ion-tools integration)
- [ ] Task 3: Biometrics (face-api.js enrollment)
- [ ] Task 4: Recovery (Shamir secret sharing)
- [ ] Task 5: Credentials (W3C VC + ZK proofs)
- [ ] Task 6: Bluetooth sync
- [ ] Task 7: Wallet (USDC + M-Pesa/bKash bridge)

## Contributing

This is an open-source project. Contributions are welcome, but please follow the hard rules and performance targets outlined above.

## License

MIT

## Support

For questions or issues, open an issue on GitHub or contact the maintainers.

---

**Status:** Scaffolding complete. Ready for Task 2: DID Core.
