import React from 'react';
import { ShoppingBag } from 'lucide-react';
import type { OrderItem } from '../../types/order.ts';

type ShipmentProgressStepsProps = {
  activeStep: 0 | 1 | 2 | 3;
  labels: [string, string, string];
};

export function ShipmentProgressSteps({ activeStep, labels }: ShipmentProgressStepsProps) {
  const steps = [1, 2, 3] as const;

  return (
    <div className="flex items-center gap-2 mt-4">
      {steps.map((step, index) => {
        const isComplete = activeStep >= step;
        const isCurrent = activeStep === step || (activeStep === 0 && step === 1);

        return (
          <React.Fragment key={step}>
            <div className="flex flex-col items-center gap-1 min-w-0 flex-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-colors ${
                  isComplete
                    ? 'bg-diyar-brown border-diyar-brown text-white'
                    : isCurrent
                      ? 'border-diyar-brown text-diyar-brown bg-amber-50'
                      : 'border-gray-200 text-gray-400 bg-white'
                }`}
              >
                {step}
              </div>
              <span
                className={`text-[10px] md:text-xs font-bold text-center leading-tight ${
                  isComplete || isCurrent ? 'text-diyar-dark' : 'text-gray-400'
                }`}
              >
                {labels[index]}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
                className={`h-0.5 flex-1 min-w-4 mb-5 rounded ${
                  activeStep > step ? 'bg-diyar-brown' : 'bg-gray-200'
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

type OrderLineItemThumbProps = {
  item: OrderItem;
  productFallback: string;
};

export function OrderLineItemThumb({ item, productFallback }: OrderLineItemThumbProps) {
  return (
    <div className="flex items-center gap-3 min-w-0">
      <div className="w-14 h-14 rounded-lg overflow-hidden bg-gray-50 border border-gray-100 shrink-0 flex items-center justify-center">
        {item.image_url ? (
          <img
            src={item.image_url}
            alt={item.product_name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        ) : (
          <ShoppingBag size={20} className="text-gray-300" />
        )}
      </div>
      <div className="min-w-0">
        <p className="font-bold text-sm text-diyar-dark line-clamp-2">
          {item.product_name || productFallback}
        </p>
        {item.quantity > 1 && <p className="text-xs text-gray-500 mt-0.5">× {item.quantity}</p>}
      </div>
    </div>
  );
}

export function resolveShipmentProgress(
  shipmentStatus?: string,
  vendorOrderStatus?: string,
): 0 | 1 | 2 | 3 {
  const status = shipmentStatus ?? vendorOrderStatus ?? 'pending';

  if (status === 'delivered') {
    return 3;
  }

  if (status === 'shipped') {
    return 2;
  }

  if (status === 'cancelled') {
    return 0;
  }

  if (['prepared', 'processing', 'accepted', 'pending'].includes(status)) {
    return 1;
  }

  return 0;
}

export function shipmentStatusKey(
  shipmentStatus?: string,
  vendorOrderStatus?: string,
): 'delivered' | 'shipped' | 'preparing' | 'cancelled' {
  const status = shipmentStatus ?? vendorOrderStatus ?? 'pending';

  if (status === 'delivered') {
    return 'delivered';
  }

  if (status === 'shipped') {
    return 'shipped';
  }

  if (status === 'cancelled') {
    return 'cancelled';
  }

  return 'preparing';
}

export function orderStatusBadgeKey(
  status: string,
): 'inDelivery' | 'completed' | 'cancelled' | 'pending' {
  if (status === 'completed') {
    return 'completed';
  }

  if (status === 'cancelled') {
    return 'cancelled';
  }

  if (status === 'pending') {
    return 'pending';
  }

  return 'inDelivery';
}
