import { Navigate } from 'react-router-dom';

/** @deprecated Route merged into Wallet — preserve path for existing links */
export function CredentialsWallet() {
  return <Navigate to="/wallet?tab=credentials" replace />;
}

export default CredentialsWallet;
