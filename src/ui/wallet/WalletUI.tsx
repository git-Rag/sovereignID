/**
 * Wallet — credentials + transactions (tabs)
 */

import { useSearchParams } from 'react-router-dom';
import { useCallback, useEffect, useState } from 'react';
import { Cake, ChevronDown, ChevronUp, Fingerprint, Globe } from 'lucide-react';
import { getDIDDocument } from '../../lib/config';
import { useToast } from '../../context/ToastContext';

type Cred = {
  type: string;
  issuer: string;
  proof: 'Ready' | 'Pending Issuer';
  Icon: typeof Cake;
};

const credentials: Cred[] = [
  { type: 'Age verification', issuer: 'NGO Refugee Support', proof: 'Ready', Icon: Cake },
  { type: 'Biometric identity', issuer: 'Self-sovereign', proof: 'Ready', Icon: Fingerprint },
  { type: 'Refugee status', issuer: 'UNHCR', proof: 'Pending Issuer', Icon: Globe },
];

export function WalletUI() {
  const [params, setParams] = useSearchParams();
  const tab = params.get('tab') === 'transactions' ? 'transactions' : 'credentials';
  const { showToast } = useToast();

  const setTab = useCallback(
    (t: 'credentials' | 'transactions') => {
      setParams(t === 'credentials' ? {} : { tab: 'transactions' });
    },
    [setParams],
  );

  const [expanded, setExpanded] = useState<number | null>(null);
  const [did, setDid] = useState<string>('');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const doc = await getDIDDocument();
        if (cancelled) return;
        setDid(typeof doc?.id === 'string' ? doc.id : '');
      } catch (e) {
        console.error(e);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const toggle = (idx: number) => {
    setExpanded((e) => (e === idx ? null : idx));
  };

  const presentProof = () => {
    showToast('Proof packaged on device');
  };

  return (
    <div>
      <header className="wallet-head">
        <h1 className="wallet-head__title">Wallet</h1>
        <p className="wallet-head__sub">Your credentials and aid history</p>
      </header>

      <div className="wallet-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'credentials'}
          className={`wallet-tab${tab === 'credentials' ? ' wallet-tab--active' : ''}`}
          onClick={() => setTab('credentials')}
        >
          Credentials
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'transactions'}
          className={`wallet-tab${tab === 'transactions' ? ' wallet-tab--active' : ''}`}
          onClick={() => setTab('transactions')}
        >
          Transactions
        </button>
      </div>

      {tab === 'credentials' && (
        <div className="wallet-panel" role="tabpanel">
          {credentials.map((cred, idx) => {
            const Icon = cred.Icon;
            const isOpen = expanded === idx;
            return (
              <article key={idx} className="wallet-cred">
                <button type="button" className="wallet-cred__btn" onClick={() => toggle(idx)}>
                  <div className="wallet-cred__row">
                    <div className="wallet-cred__icon">
                      <Icon size={20} strokeWidth={1.5} />
                    </div>
                    <div className="wallet-cred__meta">
                      <h3 className="wallet-cred__name">{cred.type}</h3>
                      <p className="wallet-cred__issuer">{cred.issuer}</p>
                    </div>
                    {cred.proof === 'Ready' ? (
                      <span className="badge-pill badge-pill--success">Verified</span>
                    ) : (
                      <span className="badge-pill badge-pill--warn">Pending</span>
                    )}
                    {isOpen ? (
                      <ChevronUp size={18} strokeWidth={1.5} color="var(--text-muted)" aria-hidden />
                    ) : (
                      <ChevronDown size={18} strokeWidth={1.5} color="var(--text-muted)" aria-hidden />
                    )}
                  </div>
                </button>
                <div className={`wallet-cred__expand${isOpen ? ' wallet-cred__expand--open' : ''}`}>
                  <div className="wallet-cred__detail">
                    <div className="wallet-cred__detail-row">
                      <span className="text-muted">DID ·</span> {did || '—'}
                    </div>
                    <div className="wallet-cred__detail-row">
                      <span className="text-muted">Issued ·</span> {new Date().toLocaleDateString()}
                    </div>
                    <div className="wallet-cred__detail-row">
                      <span className="text-muted">Signature ·</span> ed25519…a3f9
                    </div>
                    <button type="button" className="btn-primary mt-3" onClick={presentProof}>
                      Present proof
                    </button>
                  </div>
                </div>
              </article>
            );
          })}

          <div className="wallet-zk">
            <h2 className="wallet-zk__title">Zero-knowledge proof</h2>
            <p className="wallet-zk__text">Prove you&apos;re over 18 without revealing your date of birth.</p>
            <button type="button" className="btn-secondary" onClick={presentProof}>
              Generate ZK proof
            </button>
          </div>
        </div>
      )}

      {tab === 'transactions' && (
        <div className="wallet-panel" role="tabpanel">
          <div className="wallet-tx">
            <span>Today · Withdrawal · M-Pesa</span>
            <span>−$25.00</span>
          </div>
          <div className="wallet-tx">
            <span>Yesterday · Aid deposit</span>
            <span className="wallet-tx__amt--in">+$50.00</span>
          </div>
          <div className="wallet-tx">
            <span>Pending · Verification fee</span>
            <span>$0.00</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default WalletUI;
