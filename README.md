# SovereignID

Self-sovereign identity for stateless refugees — offline-first, permanent, and user-controlled.

SovereignID is a Progressive Web App that gives refugees permanent, self-sovereign digital identities without relying on governments or constant internet access. Built with decentralized principles, it enables secure recovery, privacy-preserving verification, and real-world usability in low-connectivity environments.

---

## Features

- **Self-sovereign identity** — User-owned, institution-independent  
- **Fully offline-first** — Core flows work without internet connectivity  
- **Social recovery** — 3-of-5 guardian Shamir secret sharing  
- **Privacy-preserving verification** — Zero-knowledge proofs for credential disclosure  
- **QR-based sharing** — Simple identity and credential exchange  
- **Offline assistant** — Rule-based recovery guidance  
- **Mock aid wallet** — Real-world simulation with USDC and M-Pesa  

---

## Directory Structure

```
vihaan/
├── .env.example
├── .github/
├── .gitignore
├── eslint.config.js
├── index.html
├── package.json
├── package-lock.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── README.md
│
├── backend/                    Backend services
│
├── public/                     Static assets and PWA configuration
│   ├── icons/
│   ├── manifest.json
│   └── sw.js
│
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── global.css
    │
    ├── core/                   Core cryptographic and identity logic
    │   ├── did/                DID generation and anchoring (ion-tools)
    │   ├── biometric/          Face embedding and SHA-256 hashing
    │   ├── recovery/           Shamir secret sharing and guardians
    │   ├── credentials/        W3C VC issuance and verification
    │   └── zk/                 Zero-knowledge proofs (snarkjs + Circom)
    │
    ├── sync/                   Offline synchronization and networking
    │   ├── bluetooth/          Web Bluetooth peer discovery and gossip
    │   └── queue/              Operation queue for offline-first mode
    │
    ├── wallet/                 USDC wallet integration
    │   ├── usdc/               Circle SDK integration
    │   └── bridge/             M-Pesa and bKash conversion layer
    │
    ├── ui/                     User interface screens and pages
    │   ├── enrollment/         Face scan and guardian setup flow
    │   ├── recovery/           Social recovery interface
    │   ├── credentials/        Credential wallet and ZK proof presentation
    │   ├── wallet/             Balance, transactions, and aid receipt
    │   ├── layout/             Layout components
    │   ├── HomePage.tsx
    │   ├── RoleSelectPage.tsx
    │   ├── RootRedirect.tsx
    │   ├── SettingsPage.tsx
    │   ├── ShareIdPage.tsx
    │   └── VerifyPage.tsx
    │
    ├── components/             Reusable UI components
    │   ├── FaceScan.tsx
    │   ├── QRScanner.tsx
    │   └── InstallBanner.tsx
    │
    ├── hooks/                  Custom React hooks
    │   └── useOnline.ts
    │
    ├── lib/                    Utilities and configuration
    │   ├── config.ts
    │   ├── crypto.ts
    │   ├── storage.ts
    │   └── serviceWorkerRegister.ts
    │
    ├── context/                React context providers
    │   └── ToastContext.tsx
    │
    └── utils/                  Helper utilities
        └── camera.ts
```

---

## Getting Started

### Prerequisites

- Node.js 18 or later
- npm or yarn

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Visit `http://localhost:5173` to view the application.

### Production Build

```bash
npm run build
npm run preview
```

---

## Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Frontend | React 19, Vite, TypeScript | PWA framework and tooling |
| Identity | ion-tools | Bitcoin-anchored DIDs |
| Biometrics | face-api.js | Face embedding detection |
| Cryptography | Web Crypto API | Client-side encryption |
| Secret Sharing | secrets.js | SLIP-0039 Shamir splitting |
| Zero-Knowledge Proofs | snarkjs, Circom | Groth16 proof generation |
| Storage | IndexedDB | Encrypted local persistence |
| Networking | Web Bluetooth API | Peer-to-peer synchronization |
| Wallet | Circle SDK | USDC integration |
| Offline Support | Service Worker | PWA offline capabilities |

---

## Available Scripts

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## License

MIT

## Project Info

This project was developed at the DTU Vihaan 9.0 Hackathon in under 24 hours constraint.

---
