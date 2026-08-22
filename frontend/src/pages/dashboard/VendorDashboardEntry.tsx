import { Navigate, useSearchParams } from 'react-router-dom';
import { ProtectedRoute } from '../../components/routes/ProtectedRoute.tsx';
import { RoleName } from '../../lib/auth/roles.ts';
import VendorDashboard from './VendorDashboard.tsx';

/** Redirects legacy email links (`?team_invite=`) to the dedicated invite page. */
export default function VendorDashboardEntry() {
  const [searchParams] = useSearchParams();
  const legacyToken = searchParams.get('team_invite');

  if (legacyToken) {
    return <Navigate to={`/team-invite?token=${encodeURIComponent(legacyToken)}`} replace />;
  }

  return (
    <ProtectedRoute roles={[RoleName.Vendor]}>
      <VendorDashboard />
    </ProtectedRoute>
  );
}
