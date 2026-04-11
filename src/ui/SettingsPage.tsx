import { useNavigate } from 'react-router-dom';

export function SettingsPage() {
  const navigate = useNavigate();

  return (
    <div className="page-pad page-enter">
      <h1 className="page-title">Settings</h1>
      <p className="page-sub">Security, recovery, and device preferences</p>

      <div className="card card--shadow-sm">
        <button type="button" className="settings-row__btn settings-row" onClick={() => navigate('/enrollment')}>
          Enrollment &amp; keys
        </button>
        <button type="button" className="settings-row__btn settings-row" onClick={() => navigate('/recovery')}>
          Recovery flow
        </button>
        <button type="button" className="settings-row__btn settings-row" onClick={() => navigate('/wallet')}>
          Wallet &amp; credentials
        </button>
        <div className="settings-row">
          <span>App version</span>
          <span className="settings-row__val">0.1.0</span>
        </div>
      </div>
    </div>
  );
}
