# SovereignID

SovereignID is an offline-first, self-sovereign identity system that gives refugees permanent, user-controlled digital identities without relying on governments or constant internet access.  
Built with decentralized principles, it enables secure recovery, privacy-preserving verification, and real-world usability in low-connectivity environments.

---

## Features

- Self-sovereign identity (user-owned, not institution-controlled)  
- Fully offline-first architecture  
- Social recovery using a 3-of-5 guardian system  
- Privacy-preserving credential verification  
- QR-based identity sharing and verification  
- Intelligent recovery assistant (offline, rule-based)  
- Mock aid wallet for real-world simulation  

---

## Project Structure

```
sovereignid/
├── public/
│   ├── icons/
│   ├── manifest.json
│   └── sw.js                # Service worker (offline support)
│
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── routes.jsx
│
│   ├── assets/
│   │   ├── images/
│   │   └── icons/
│
│   ├── components/         # Reusable UI components
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── QRCodeDisplay.jsx
│   │   ├── QRScanner.jsx
│   │   └── Loader.jsx
│
│   ├── pages/              # Core application screens
│   │   ├── Home.jsx
│   │   ├── Enroll.jsx
│   │   ├── Wallet.jsx
│   │   ├── Recover.jsx
│   │   ├── Verify.jsx
│   │   └── Assistant.jsx
│
│   ├── features/           # Core logic modules
│   │   ├── identity/
│   │   │   ├── createDID.js
│   │   │   ├── identityStore.js
│   │   │   └── qrIdentity.js
│   │   │
│   │   ├── recovery/
│   │   │   ├── shamirSplit.js
│   │   │   ├── shamirRecover.js
│   │   │   └── guardianFlow.js
│   │   │
│   │   ├── credentials/
│   │   │   ├── issueCredential.js
│   │   │   ├── storeCredential.js
│   │   │   └── verifyCredential.js
│   │   │
│   │   ├── assistant/
│   │   │   ├── decisionEngine.js
│   │   │   ├── questions.js
│   │   │   └── flowController.js
│   │   │
│   │   ├── qr/
│   │   │   ├── generateQR.js
│   │   │   └── scanQR.js
│   │   │
│   │   └── wallet/
│   │       ├── walletStore.js
│   │       └── mockTransactions.js
│
│   ├── hooks/
│   │   ├── useIdentity.js
│   │   ├── useRecovery.js
│   │   └── useCredentials.js
│
│   ├── utils/
│   │   ├── storage.js
│   │   ├── crypto.js
│   │   ├── constants.js
│   │   └── helpers.js
│
│   ├── context/
│   │   └── AppContext.jsx
│
│   ├── styles/
│   │   └── global.css
│
│   └── data/
│       ├── sampleCredentials.json
│       └── guardians.json
│
├── package.json
├── vite.config.js
└── README.md
```

---

## Getting Started

1. Install dependencies:
   npm install

2. Run the development server:
   npm run dev

3. Open the app in your browser:
   http://localhost:5173
