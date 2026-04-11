import { useNavigate } from 'react-router-dom';
import { Briefcase, ChevronRight, User } from 'lucide-react';

const ROLE_KEY = 'sovereignid_role';

export function RoleSelectPage() {
  const navigate = useNavigate();

  const chooseRefugee = () => {
    localStorage.setItem(ROLE_KEY, 'refugee');
    navigate('/home', { replace: true });
  };

  const chooseAid = () => {
    localStorage.setItem(ROLE_KEY, 'aid');
    navigate('/verify', { replace: true });
  };

  return (
    <div className="role-page page-enter">
      <h1 className="role-page__title">SovereignID</h1>
      <p className="role-page__tag">Permanent identity. No government required.</p>
      <div className="role-page__rule" aria-hidden />

      <div className="role-cards stagger">
        <button type="button" className="role-card" onClick={chooseRefugee}>
          <div className="role-card__icon">
            <User size={20} strokeWidth={1.5} />
          </div>
          <div className="role-card__body">
            <div className="role-card__title">I&apos;m a Refugee</div>
            <div className="role-card__sub">Create and manage your identity</div>
          </div>
          <ChevronRight size={16} strokeWidth={1.5} color="var(--text-muted)" aria-hidden />
        </button>

        <button type="button" className="role-card" onClick={chooseAid}>
          <div className="role-card__icon">
            <Briefcase size={20} strokeWidth={1.5} />
          </div>
          <div className="role-card__body">
            <div className="role-card__title">I&apos;m an Aid Worker</div>
            <div className="role-card__sub">Issue credentials and verify proofs</div>
          </div>
          <ChevronRight size={16} strokeWidth={1.5} color="var(--text-muted)" aria-hidden />
        </button>
      </div>

      <p className="role-page__footer">Your data never leaves your device</p>
    </div>
  );
}
