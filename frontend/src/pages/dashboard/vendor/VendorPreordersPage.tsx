import { Navigate } from 'react-router-dom';

export default function VendorPreordersPage() {
  return <Navigate to="/dashboard/vendor/orders?tab=preorders" replace />;
}
