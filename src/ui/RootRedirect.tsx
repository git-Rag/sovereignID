import { Navigate } from 'react-router-dom';

const ROLE_KEY = 'sovereignid_role';

export function RootRedirect() {
  if (typeof window !== 'undefined' && !localStorage.getItem(ROLE_KEY)) {
    return <Navigate to="/welcome" replace />;
  }
  return <Navigate to="/home" replace />;
}
