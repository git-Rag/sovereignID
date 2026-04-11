import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { ChevronLeft, Home, ScanLine, Settings, Wallet, WifiOff } from 'lucide-react';
import { useOnline } from '../../hooks/useOnline';
import { useEffect, useReducer } from 'react';

function initialsFromStorage(): string {
  if (typeof window === 'undefined') return 'RF';
  return localStorage.getItem('sovereignid_initials') || 'RF';
}

export function ShellLayout() {
  const { isOnline } = useOnline();
  const location = useLocation();
  const navigate = useNavigate();
  const path = location.pathname;
  const [, refreshAvatar] = useReducer((n: number) => n + 1, 0);

  const showHomeRight = path === '/home';
  const initials = showHomeRight ? initialsFromStorage() : '';

  useEffect(() => {
    const onIdentity = () => refreshAvatar();
    window.addEventListener('sovereignid-identity-updated', onIdentity);
    return () => window.removeEventListener('sovereignid-identity-updated', onIdentity);
  }, []);

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/home');
  };

  return (
    <div className={`shell-view ${!isOnline ? 'shell-view--offline' : ''}`}>
      <header className="shell-topbar">
        <span className="shell-topbar__title">SovereignID</span>
        {showHomeRight ? (
          <div className="shell-avatar" aria-hidden>
            {initials.slice(0, 2).toUpperCase()}
          </div>
        ) : (
          <button type="button" className="shell-topbar__btn" onClick={goBack} aria-label="Back">
            <ChevronLeft size={20} strokeWidth={1.5} />
          </button>
        )}
      </header>

      {!isOnline && (
        <div className="shell-offline" role="status">
          <WifiOff size={13} strokeWidth={1.5} aria-hidden />
          You&apos;re offline — your identity still works
        </div>
      )}

      <main key={path} className="shell-main page-enter">
        <Outlet />
      </main>

      <nav className="bottom-nav" aria-label="Main">
        <NavLink
          to="/home"
          className={({ isActive }) => `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
        >
          <Home size={20} strokeWidth={1.5} />
          <span>Home</span>
          <span className="bottom-nav__dot" aria-hidden />
        </NavLink>
        <NavLink
          to="/wallet"
          className={({ isActive }) => `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
        >
          <Wallet size={20} strokeWidth={1.5} />
          <span>Wallet</span>
          <span className="bottom-nav__dot" aria-hidden />
        </NavLink>
        <NavLink
          to="/verify"
          className={({ isActive }) => `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
        >
          <ScanLine size={20} strokeWidth={1.5} />
          <span>Verify</span>
          <span className="bottom-nav__dot" aria-hidden />
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) => `bottom-nav__item${isActive ? ' bottom-nav__item--active' : ''}`}
        >
          <Settings size={20} strokeWidth={1.5} />
          <span>Settings</span>
          <span className="bottom-nav__dot" aria-hidden />
        </NavLink>
      </nav>
    </div>
  );
}
