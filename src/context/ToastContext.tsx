import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useLocation } from 'react-router-dom';

type ToastContextValue = {
  showToast: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [message, setMessage] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  const showToast = useCallback(
    (msg: string) => {
      clearTimers();
      setMessage(msg);
      setVisible(true);
      hideTimer.current = setTimeout(() => {
        setVisible(false);
        hideTimer.current = setTimeout(() => setMessage(null), 200);
      }, 2500);
    },
    [clearTimers],
  );

  useEffect(() => () => clearTimers(), [clearTimers]);

  const enroll = location.pathname === '/enrollment';

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {message ? (
        <div
          className={`toast-root${visible ? ' toast-root--visible' : ''}${enroll ? ' toast-root--enroll' : ''}`}
          role="status"
        >
          {message}
        </div>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
