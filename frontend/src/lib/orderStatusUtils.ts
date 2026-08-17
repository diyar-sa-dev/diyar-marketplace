import type { Order } from '../types/order.ts';

export function resolveEffectiveOrderStatus(order: Order): Order['status'] {
  if (order.effective_status) {
    return order.effective_status;
  }

  if (order.status === 'cancelled') {
    return 'cancelled';
  }

  const vendorOrders = order.vendor_orders ?? [];

  if (vendorOrders.length > 0 && vendorOrders.every((vendorOrder) => vendorOrder.status === 'cancelled')) {
    return 'cancelled';
  }

  return order.status;
}

export function orderNeedsPayment(order: Order): boolean {
  if (resolveEffectiveOrderStatus(order) !== 'pending') {
    return false;
  }

  const paymentStatus = order.payment?.status;

  if (paymentStatus === 'cancelled' || paymentStatus === 'paid') {
    return false;
  }

  return paymentStatus === 'pending' || paymentStatus === 'failed' || paymentStatus === 'expired';
}

export function orderPaymentPaid(order: Order): boolean {
  return order.payment?.status === 'paid';
}

export function orderPaymentCancelled(order: Order): boolean {
  return (
    resolveEffectiveOrderStatus(order) === 'cancelled' ||
    order.payment?.status === 'cancelled'
  );
}
