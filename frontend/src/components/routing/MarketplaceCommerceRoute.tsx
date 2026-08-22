import { Navigate } from 'react-router-dom';
import { useAuth } from '../../hooks/auth/useAuth.ts';
import { shouldHideMarketplaceCommerce } from '../../lib/marketplaceCommerce.ts';

type MarketplaceCommerceRouteProps = {
  children: React.ReactNode;
};

/** Blocks checkout and other commerce flows for operations (admin) accounts. */
export function MarketplaceCommerceRoute({ children }: MarketplaceCommerceRouteProps) {
  const { user } = useAuth();

  if (shouldHideMarketplaceCommerce(user?.roles)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
