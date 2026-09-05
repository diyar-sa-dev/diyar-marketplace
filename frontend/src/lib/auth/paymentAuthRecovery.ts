/** Routes where a full navigation may return before the session cookie is readable again. */
export function isPaymentAuthRecoveryPath(pathname: string, search: string): boolean {
  if (pathname.startsWith('/checkout/payment')) {
    return true;
  }

  if (pathname !== '/orders') {
    return false;
  }

  const params = new URLSearchParams(search);
  if (params.has('highlight')) {
    return true;
  }

  const payment = params.get('payment');
  return (
    payment === 'callback' || payment === 'paid' || payment === 'failed' || payment === 'expired'
  );
}
