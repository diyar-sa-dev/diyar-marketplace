<?php

namespace App\Enums;

enum NotificationType: string
{
    case AuthRegistration = 'auth.registration';
    case AuthOtp = 'auth.otp';

    case OrderCreated = 'order.created';
    case VendorOrderReceived = 'order.vendor_received';
    case OrderConfirmed = 'order.confirmed';
    case OrderShipped = 'order.shipped';
    case OrderDelivered = 'order.delivered';
    case OrderCancelled = 'order.cancelled';
    case ReturnUpdated = 'return.updated';

    case PaymentSuccess = 'payment.success';
    case PaymentFailed = 'payment.failed';
    case PaymentRefunded = 'payment.refunded';

    case OfferReceived = 'offer.received';
    case OfferAccepted = 'offer.accepted';
    case OfferRejected = 'offer.rejected';

    case BookingCreated = 'booking.created';
    case BookingConfirmed = 'booking.confirmed';
    case BookingCompleted = 'booking.completed';
    case BookingCancelled = 'booking.cancelled';
    case BookingUpdated = 'booking.updated';

    case ReviewCreated = 'review.created';
    case ReviewReply = 'review.reply';

    case ProductStockLow = 'product.stock_low';
    case ProductOutOfStock = 'product.out_of_stock';

    case TeamInvitation = 'team.invitation';
    case TeamMemberAdded = 'team.member_added';

    case CouponActivated = 'coupon.activated';
    case CouponDeactivated = 'coupon.deactivated';
    case CouponExpired = 'coupon.expired';

    case SystemAlert = 'system.alert';
    case SystemPromotion = 'system.promotion';

    case ChatMessageReceived = 'chat.message_received';

    case AffiliateCommissionAvailable = 'affiliate.commission_available';
    case AffiliatePayoutRequested = 'affiliate.payout_requested';

    public function category(): string
    {
        return explode('.', $this->value)[0];
    }
}
