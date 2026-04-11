import { Navigate } from 'react-router-dom';

const ROLE_KEY = 'sovereignid_role';
const ENROLLED_KEY = 'isEnrolled';

export function RootRedirect() {
  if (typeof window !== 'undefined') {
    // If no role is set, go to welcome screen
    if (!localStorage.getItem(ROLE_KEY)) {
      return <Navigate to="/welcome" replace />;
    }
  }

  return <Navigate to="/home" replace />;
}
