<?php

namespace App\Enums;

enum AnalyticsEventType: string
{
    case ProductViewed = 'product_viewed';
    case ServiceViewed = 'service_viewed';
    case AddToCart = 'add_to_cart';
    case CheckoutStarted = 'checkout_started';
    case CheckoutCompleted = 'checkout_completed';
    case PaymentStarted = 'payment_started';
    case PaymentCompleted = 'payment_completed';
}
