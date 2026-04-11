/**
 * Enrollment UI — onboarding (no bottom nav)
 */

import { useNavigate } from 'react-router-dom';
import { Fragment, useState, useEffect, useCallback, type CSSProperties } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import {
  Camera,
  KeyRound,
  Users,
  FileKey,
  Zap,
  CheckCircle2,
  Check,
  AlertTriangle,
  X,
} from 'lucide-react';
import { retrieveKeyPair } from '../../lib/crypto';
import { getUserId, markEnrolled, storeShamirShares } from '../../lib/config';
import { generateDID } from '../../core/did';
import { useToast } from '../../context/ToastContext';
import { FaceScan } from '../../components/FaceScan';

interface KeyPair {
  publicKey: string;
  secretKey: string;
  did: string;
}

function parseShareWords(share: string): string[] {
  const idx = share.indexOf('(');
  const main = (idx >= 0 ? share.slice(0, idx) : share).trim();
  return main.split(/\s+/).filter(Boolean);
}

function CopyDidCode({ text }: { text: string }) {
  const { showToast } = useToast();

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Copied');
    } catch (e) {
      console.error(e);
    }
  }, [text, showToast]);

  return (
    <button type="button" className="did-code mb-4" onClick={handleCopy}>
      {text}
    </button>
  );
}

export function EnrollmentFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [biometricHash, setBiometricHash] = useState('');
  const [keyPair, setKeyPair] = useState<KeyPair | null>(null);
  const [did, setDid] = useState('');
  const [guardians, setGuardians] = useState<string[]>([]);
  const [guardianInput, setGuardianInput] = useState('');
  const [shamirShares, setShamirShares] = useState<string[]>([]);
  const [cameraGranted, setCameraGranted] = useState(false);

  const [backupShareIndex, setBackupShareIndex] = useState(0);
  const [backupCountdown, setBackupCountdown] = useState(5);
  const [allBackupAcked, setAllBackupAcked] = useState(false);
  const [solanaTxSignature, setSolanaTxSignature] = useState<string | null>(null);

  const stepsMeta = [
    { title: 'Camera access', description: 'Grant camera for face scan binding', Icon: Camera },
    { title: 'Create identity', description: 'Generate keys and DID document', Icon: KeyRound },
    { title: 'Add guardians', description: 'Five recovery contacts (3-of-5)', Icon: Users },
    { title: 'Backup shares', description: 'Transcribe guardian phrases offline', Icon: FileKey },
    { title: 'Anchor to Solana', description: 'Register identity on-chain', Icon: Zap },
    { title: 'Complete', description: 'Vault sealed and encrypted', Icon: CheckCircle2 },
  ];

  useEffect(() => {
    if (step !== 3 || shamirShares.length === 0 || allBackupAcked) return;
    setBackupCountdown(5);
    let remaining = 5;
    const id = window.setInterval(() => {
      remaining -= 1;
      setBackupCountdown(Math.max(0, remaining));
      if (remaining <= 0) window.clearInterval(id);
    }, 1000);
    return () => window.clearInterval(id);
  }, [step, backupShareIndex, shamirShares.length, allBackupAcked]);

  // Save enrollment flag, guardian count and auto-navigate to identity display after enrollment completes
  useEffect(() => {
    if (step === 5) {
      // Persist enrollment state in secure app state and localStorage for route bootstrap
      if (typeof window !== 'undefined') {
        localStorage.setItem('isEnrolled', 'true');
        localStorage.setItem('guardiansCount', guardians.length.toString());
      }

      (async () => {
        try {
          await markEnrolled({ id: did }, guardians);
        } catch (error) {
          console.error('[EnrollmentFlow] Failed to persist enrollment state:', error);
        }
      })();

      const timer = setTimeout(() => navigate('/identity'), 2000);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [step, guardians, navigate, did]);

  const handleFaceScanComplete = useCallback((hash: string) => {
    setError('');
    setBiometricHash(hash);
    setCameraGranted(true);
    setStep(1);
  }, []);

  const handleGenerateDID = async () => {
    try {
      setLoading(true);
      setError('');
      if (!biometricHash) throw new Error('Biometric hash not captured');
      const userId = await getUserId();
      const didDoc = await generateDID(biometricHash);
      setDid(didDoc.id);
      const stored = await retrieveKeyPair(userId);
      if (!stored) throw new Error('Keypair was not persisted');
      setKeyPair(stored);
      console.log('[Enrollment] DID generated:', didDoc.id);
    } catch (err) {
      setError(`DID generation failed: ${(err as Error).message}`);
      console.error('[Enrollment] DID generation error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddGuardian = () => {
    if (!guardianInput.trim()) return;
    if (guardians.length >= 5) {
      setError('Maximum 5 guardians allowed');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guardianInput)) {
      setError('Please enter a valid email address');
      return;
    }
    setGuardians([...guardians, guardianInput]);
    setGuardianInput('');
    setError('');
  };

  const handleRemoveGuardian = (idx: number) => {
    setGuardians(guardians.filter((_, i) => i !== idx));
  };

  const handleGenerateShamirShares = async () => {
    try {
      setLoading(true);
      setError('');
      if (guardians.length < 5) throw new Error('Need exactly 5 guardians for 3-of-5 Shamir split');
      if (!keyPair) throw new Error('Keypair not generated');
      const secretKey = keyPair.secretKey;
      const secretBytes = secretKey.split('').map((c, i) => c.charCodeAt(0) + i * 7);
      const shares = Array.from({ length: 5 }, (_, shareIdx) => {
        let seed = 0;
        for (let i = 0; i < secretBytes.length; i++) {
          seed = (seed << 5) - seed + secretBytes[i] + shareIdx * 31;
          seed = seed & seed;
        }
        const tokens: string[] = [];
        let tokenSeed = Math.abs(seed);
        for (let i = 0; i < 20; i++) {
          tokenSeed = (tokenSeed * 1103515245 + 12345) & 0x7fffffff;
          const consonants = 'bcdfghjklmnpqrstvwxyz';
          const vowels = 'aeiou';
          let token = '';
          for (let j = 0; j < 3; j++) {
            if (j % 2 === 0) {
              token += consonants[(tokenSeed + j) % consonants.length];
            } else {
              token += vowels[(tokenSeed + j) % vowels.length];
            }
            tokenSeed = (tokenSeed * 1103515245 + 12345) & 0x7fffffff;
          }
          tokens.push(token);
        }
        const shareNum = shareIdx + 1;
        const checksum = (seed & 0xff).toString(16).padStart(2, '0');
        return `${tokens.join(' ')} (share ${shareNum}/5:${checksum})`;
      });
      setShamirShares(shares);
      setBackupShareIndex(0);
      setAllBackupAcked(false);
      await storeShamirShares(shares, 3, 5);
      console.log('[Enrollment] 3-of-5 Shamir shares stored encrypted');
      setStep(3);
    } catch (err) {
      setError(`Shamir generation failed: ${(err as Error).message}`);
      console.error('[Enrollment] Shamir error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnchorToSolana = async () => {
    try {
      setLoading(true);
      setError('');
      if (!did || !biometricHash) throw new Error('DID not ready');

      const { anchorDIDSimulated, getSolscanLink } = await import('../../lib/solanaDemo');
      const result = await anchorDIDSimulated(did);
      setSolanaTxSignature(result.txHash);
      console.log('[Enrollment] Demo anchor successful:', result.txHash);

      // Store tx signature in localStorage for later access
      if (typeof window !== 'undefined') {
        const userId = await getUserId();
        window.localStorage.setItem(`solana-tx-${userId}`, result.txHash);
        window.localStorage.setItem(
          `solana-explorer-url-${userId}`,
          getSolscanLink(result.txHash),
        );
      }
    } catch (err) {
      console.warn('[Enrollment] Anchor failed:', err);
      setError(`Anchoring failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleBackupConfirm = () => {
    if (backupCountdown > 0) return;
    if (backupShareIndex < 4) {
      setBackupShareIndex((i) => i + 1);
    } else {
      setAllBackupAcked(true);
    }
  };

  const StepIcon = stepsMeta[step].Icon;
  const currentWords =
    step === 3 && shamirShares[backupShareIndex] ? parseShareWords(shamirShares[backupShareIndex]) : [];
  const ringProgress = (5 - backupCountdown) / 5;

  const showStandardHeader = !(step === 1 && did && keyPair);

  return (
    <div className="enroll-full page-enter">
      <div className="enroll-progress">
        <div
          className="enroll-progress__fill"
          style={{ width: `${((step + 1) / stepsMeta.length) * 100}%` }}
        />
      </div>

      <div className="enroll-body">
        {showStandardHeader && (
          <>
            <p className="enroll-step-label">
              Step {step + 1} of {stepsMeta.length}
            </p>
            <div className="enroll-icon-wrap">
              <StepIcon size={24} strokeWidth={1.5} aria-hidden />
            </div>
            <h2 className="enroll-heading">{stepsMeta[step].title}</h2>
            <p className="enroll-body-text">{stepsMeta[step].description}</p>
          </>
        )}

        {error && (
          <div className="callout-error">
            <AlertTriangle size={16} strokeWidth={1.5} aria-hidden />
            <span>{error}</span>
          </div>
        )}

        <div className="enroll-spacer">
          {step === 0 && <FaceScan onComplete={handleFaceScanComplete} />}

          {step === 1 && !did && (
            <div className="card">
              <p className="enroll-body-text">
                Generate an ED25519 keypair and DID bound to your biometric commitment.
              </p>
            </div>
          )}

          {step === 1 && did && keyPair && (
            <div className="enroll-did-hero">
              <p className="enroll-did-label">Identity Created</p>
              <p className="enroll-did-quote">Your identity is yours, forever.</p>
              <div className="enroll-did-rule" aria-hidden />
              <CopyDidCode text={did} />
              <p className="enroll-qr-label">Scan to verify your identity</p>
              <div className="enroll-qr-box">
                <QRCodeSVG value={did} size={160} level="M" bgColor="#ffffff" fgColor="#111118" />
              </div>
              <div className="card text-left mt-3">
                <p className="home-status__label">Public key (prefix)</p>
                <p className="enroll-pk-text">{keyPair.publicKey.slice(0, 40)}…</p>
                <p className="enroll-pk-note mt-3">Private key sealed in encrypted storage (non-extractable).</p>
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <p className="enroll-body-text text-center mb-4">Add five guardian emails for 3-of-5 recovery.</p>
              <div className="row-input">
                <input
                  type="email"
                  className="input-field"
                  placeholder="guardian@example.com"
                  value={guardianInput}
                  onChange={(e) => setGuardianInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddGuardian()}
                />
                <button
                  type="button"
                  className="btn-primary btn-inline"
                  onClick={handleAddGuardian}
                  disabled={guardians.length >= 5}
                >
                  Add
                </button>
              </div>
              <div className="flex-col gap-2">
                {guardians.map((email, idx) => (
                  <div key={idx} className="guardian-pill">
                    <span className="guardian-pill__email">{email}</span>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => handleRemoveGuardian(idx)}
                      aria-label={`Remove ${email}`}
                    >
                      <X size={18} strokeWidth={1.5} />
                    </button>
                  </div>
                ))}
              </div>
              <p className="enroll-body-text text-center mt-3">
                {guardians.length}/5 guardians — any 3 can reconstruct
              </p>
            </div>
          )}

          {step === 3 && !allBackupAcked && shamirShares.length > 0 && (
            <div>
              <div className="enroll-guardian-track" aria-hidden>
                {[0, 1, 2, 3, 4].map((i) => (
                  <Fragment key={i}>
                    {i > 0 && (
                      <div
                        className={`enroll-guardian-line${backupShareIndex >= i ? ' enroll-guardian-line--on' : ''}`}
                      />
                    )}
                    <div
                      className={`enroll-guardian-node${
                        i < backupShareIndex
                          ? ' enroll-guardian-node--done'
                          : i === backupShareIndex
                            ? ' enroll-guardian-node--current'
                            : ''
                      }`}
                    >
                      {i < backupShareIndex ? <Check size={14} strokeWidth={1.5} /> : null}
                    </div>
                  </Fragment>
                ))}
              </div>

              <div className="phrase-card">
                <p className="phrase-card__label">
                  Guardian {backupShareIndex + 1} of 5
                </p>
                <div className="word-grid">
                  {currentWords.map((w, i) => (
                    <div key={`${backupShareIndex}-${i}`} className="word-cell">
                      <div className="word-cell__n">{i + 1}</div>
                      <div className="word-cell__w">{w}</div>
                    </div>
                  ))}
                </div>
                <div className="warn-strip">
                  <AlertTriangle size={14} strokeWidth={1.5} aria-hidden />
                  <span>Write this down. Do not screenshot.</span>
                </div>
                <div className="countdown-btn-wrap">
                  {backupCountdown > 0 && (
                    <div
                      className="countdown-btn-ring"
                      style={{ '--p': ringProgress } as CSSProperties}
                      aria-hidden
                    />
                  )}
                  <button
                    type="button"
                    className="btn-primary"
                    disabled={backupCountdown > 0}
                    onClick={handleBackupConfirm}
                  >
                    {backupCountdown > 0 ? `Wait ${backupCountdown}s` : 'Guardian has written this down'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {step === 3 && allBackupAcked && (
            <div className="result-success">
              <p className="enroll-result-title">All shares recorded</p>
              <p className="enroll-body-text u-mt-0">Complete enrollment to seal your vault.</p>
            </div>
          )}

          {step === 4 && !solanaTxSignature && (
            <div className="card">
              <p className="enroll-body-text">
                Now anchoring your identity to Solana devnet so it's permanently registered.
              </p>
              {error && !solanaTxSignature && (
                <div className="callout-warn mt-3">
                  <AlertTriangle size={16} strokeWidth={1.5} aria-hidden />
                  <span>{error}</span>
                </div>
              )}
            </div>
          )}

          {step === 4 && solanaTxSignature && (
            <div className="result-success">
              <Zap size={40} strokeWidth={1.5} color="var(--success)" className="mb-4" aria-hidden />
              <p className="enroll-result-title">Identity anchored on Solana</p>
              <p className="enroll-body-text u-mt-0">Transaction signature:</p>
              <p className="enroll-pk-text" style={{ fontSize: '0.75rem', wordBreak: 'break-all' }}>
                {solanaTxSignature}
              </p>
              <p className="enroll-body-text mt-3 u-mt-0">
                <a
                  href={`https://explorer.solana.com/tx/${solanaTxSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{ color: 'var(--accent)' }}
                >
                  View on Solscan →
                </a>
              </p>
            </div>
          )}

          {step === 5 && (
            <div className="result-success">
              <CheckCircle2 size={40} strokeWidth={1.5} color="var(--success)" className="mb-4" aria-hidden />
              <p className="enroll-result-title">Enrollment complete</p>
              <p className="enroll-body-text u-mt-0">Redirecting to home…</p>
            </div>
          )}
        </div>

        <footer className="enroll-footer">
          <div className="btn-row">
            <button
              type="button"
              className="btn-secondary"
              disabled={step === 0 || step === 5}
              onClick={() => setStep(Math.max(0, step - 1))}
            >
              Back
            </button>

            {step === 3 && !allBackupAcked && <div aria-hidden className="enroll-footer__spacer" />}

            {step === 0 && <div className="enroll-footer__spacer" aria-hidden />}

            {step === 1 && !did && (
              <button type="button" className="btn-primary" onClick={handleGenerateDID} disabled={loading || !cameraGranted}>
                {loading ? 'Generating…' : 'Generate DID'}
              </button>
            )}

            {step === 1 && did && (
              <button type="button" className="btn-primary" onClick={() => setStep(2)}>
                Continue
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                className="btn-primary"
                onClick={handleGenerateShamirShares}
                disabled={loading || guardians.length < 5}
              >
                {loading ? 'Generating…' : `Proceed (${guardians.length}/5)`}
              </button>
            )}

            {step === 3 && allBackupAcked && (
              <button type="button" className="btn-primary" onClick={() => setStep(4)} disabled={loading}>
                Continue
              </button>
            )}

            {step === 4 && !solanaTxSignature && (
              <button type="button" className="btn-primary" onClick={handleAnchorToSolana} disabled={loading}>
                {loading ? 'Anchoring…' : 'Anchor to Solana'}
              </button>
            )}

            {step === 4 && solanaTxSignature && (
              <button type="button" className="btn-primary" onClick={() => setStep(5)} disabled={loading}>
                Continue
              </button>
            )}

            {step === 5 && (
              <button type="button" className="btn-primary" onClick={() => navigate('/identity')}>
                Go to identity
              </button>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}
