<?php

namespace App\Services\Order;

use App\Enums\AnalyticsEventType;
use App\Enums\CartStatus;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ShipmentStatus;
use App\Enums\VendorOrderStatus;
use App\Events\Domain\OrderCreated;
use App\Events\Domain\VendorOrderReceived;
use App\Models\Address;
use App\Models\Cart;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Shipment;
use App\Models\User;
use App\Models\VendorOrder;
use App\Services\Affiliate\AffiliateAttributionService;
use App\Services\Analytics\AnalyticsEventRecorder;
use App\Services\Cart\CartService;
use App\Services\Catalog\InventoryService;
use App\Services\Checkout\CheckoutPreviewService;
use Illuminate\Database\QueryException;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

final class OrderCreationService
{
    public function __construct(
        private readonly CartService $cartService,
        private readonly CheckoutPreviewService $checkoutPreview,
        private readonly OrderNumberService $orderNumbers,
        private readonly OrderTotalsReconciliationService $reconciliation,
        private readonly InventoryService $inventory,
        private readonly SelfPurchaseGuard $selfPurchase,
        private readonly AffiliateAttributionService $affiliateAttribution,
        private readonly AnalyticsEventRecorder $analyticsEvents,
    ) {}

    /**
     * @param  list<array{vendor_account_id: string, method: string}>  $deliverySelections
     * @param  list<array{vendor_account_id: string, code: string}>  $vendorCoupons
     * @return array{order: Order, created: bool}
     */
    public function create(
        User $user,
        string $shippingAddressId,
        array $deliverySelections,
        string $idempotencyKey,
        string $payloadHash,
        array $vendorCoupons = [],
        ?string $sessionFingerprint = null,
    ): array {
        $existing = $this->findExistingIdempotentOrder($user, $idempotencyKey);

        if ($existing !== null) {
            return $this->replayExistingOrder($existing, $payloadHash);
        }

        try {
            return DB::transaction(function () use ($user, $shippingAddressId, $deliverySelections, $idempotencyKey, $payloadHash, $vendorCoupons, $sessionFingerprint) {
                $existing = Order::query()
                    ->where('user_id', $user->id)
                    ->where('idempotency_key', $idempotencyKey)
                    ->lockForUpdate()
                    ->first();

                if ($existing !== null) {
                    return $this->replayExistingOrder($existing, $payloadHash);
                }

                $order = $this->createOrderInsideTransaction(
                    $user,
                    $shippingAddressId,
                    $deliverySelections,
                    $idempotencyKey,
                    $payloadHash,
                    $vendorCoupons,
                    $sessionFingerprint,
                );

                return ['order' => $order, 'created' => true];
            });
        } catch (QueryException $exception) {
            if (! $this->isIdempotencyUniqueViolation($exception)) {
                throw $exception;
            }

            $existing = $this->findExistingIdempotentOrder($user, $idempotencyKey);

            if ($existing === null) {
                throw $exception;
            }

            return $this->replayExistingOrder($existing, $payloadHash);
        }
    }

    /**
     * @param  list<array{vendor_account_id: string, method: string}>  $deliverySelections
     */
    private function createOrderInsideTransaction(
        User $user,
        string $shippingAddressId,
        array $deliverySelections,
        string $idempotencyKey,
        string $payloadHash,
        array $vendorCoupons = [],
        ?string $sessionFingerprint = null,
    ): Order {
        $cart = Cart::query()
            ->where('user_id', $user->id)
            ->where('status', CartStatus::Active)
            ->lockForUpdate()
            ->first();

        if ($cart === null) {
            throw new UnprocessableEntityHttpException(__('diyar.checkout.cart_empty'));
        }

        $cart->loadMissing('items.product');
        $this->selfPurchase->assertCartItemsNotSelfPurchase($user, $cart->items);

        $preview = $this->checkoutPreview->preview($user, $shippingAddressId, $deliverySelections, $vendorCoupons);

        if (! $preview['valid']) {
            throw new UnprocessableEntityHttpException(__('diyar.checkout.checkout_invalid'));
        }

        $address = Address::query()->whereKey($shippingAddressId)->firstOrFail();
        $orderNumber = $this->orderNumbers->allocate();

        $order = Order::query()->create([
            'user_id' => $user->id,
            'order_number' => $orderNumber,
            'status' => OrderStatus::Pending,
            'shipping_address_id' => $address->id,
            'shipping_recipient_name' => $address->recipient_name,
            'shipping_phone' => $address->phone,
            'shipping_city' => $address->city,
            'shipping_district' => $address->district,
            'shipping_street' => $address->street,
            'shipping_building' => $address->building,
            'shipping_apartment' => $address->apartment,
            'subtotal' => $preview['totals']['subtotal'],
            'shipping_total' => $preview['totals']['shipping'],
            'assembly_total' => $preview['totals']['assembly'],
            'discount_total' => $preview['totals']['discount'],
            'vat_amount' => $preview['totals']['vat'],
            'grand_total' => $preview['totals']['total'],
            'idempotency_key' => $idempotencyKey,
            'idempotency_payload_hash' => $payloadHash,
        ]);

        foreach ($preview['vendor_groups'] as $group) {
            $coupon = $group['coupon'] ?? null;
            $vendorOrder = VendorOrder::query()->create([
                'order_id' => $order->id,
                'vendor_account_id' => $group['vendor_account_id'],
                'vendor_coupon_id' => $coupon['id'] ?? null,
                'coupon_code' => $coupon['code'] ?? null,
                'coupon_percent_snapshot' => $coupon['value'] ?? null,
                'coupon_discount_snapshot' => $group['discount'],
                'coupon_type_snapshot' => $coupon['type'] ?? null,
                'status' => VendorOrderStatus::Pending,
                'subtotal' => $group['subtotal'],
                'shipping_method' => $group['shipping']['method'],
                'shipping_cost' => $group['shipping']['cost'],
                'shipping_discount_amount' => $group['shipping']['shipping_discount'] ?? '0.00',
                'pickup_location_label' => $group['shipping']['pickup_location_label'],
                'free_shipping_applied' => $group['shipping']['free_shipping_applied'],
                'assembly_cost' => $group['assembly'],
                'discount_amount' => $group['discount'],
                'vat_amount' => $group['vat'],
                'vendor_total' => $group['vendor_total'],
            ]);

            foreach ($group['items'] as $line) {
                $attribution = $this->affiliateAttribution->resolveAttributionForProduct(
                    user: $user,
                    sessionFingerprint: $sessionFingerprint,
                    productId: $line['product_id'],
                );

                $affiliateSnapshot = $this->buildAffiliateSnapshot($attribution, $line['line_subtotal']);

                OrderItem::query()->create([
                    'vendor_order_id' => $vendorOrder->id,
                    'product_id' => $line['product_id'],
                    'product_name' => $line['product_name'],
                    'product_slug' => Product::query()->whereKey($line['product_id'])->value('slug'),
                    'unit_price' => $line['unit_price'],
                    'quantity' => $line['quantity'],
                    'line_subtotal' => $line['line_subtotal'],
                    'color_name' => $line['color']['name'],
                    'color_hex' => $line['color']['hex_code'],
                    ...$affiliateSnapshot,
                ]);

                $product = Product::query()->findOrFail($line['product_id']);
                $this->inventory->reserve(
                    product: $product,
                    user: $user,
                    quantity: (int) $line['quantity'],
                    reference: ['type' => Order::class, 'id' => $order->id],
                );
            }

            Shipment::query()->create([
                'vendor_order_id' => $vendorOrder->id,
                'status' => ShipmentStatus::Pending,
            ]);
        }

        Payment::query()->create([
            'order_id' => $order->id,
            'status' => PaymentStatus::Pending,
            'amount' => $preview['totals']['total'],
            'currency' => config('diyar.payments.currency', 'SAR'),
            'gateway' => config('diyar.payments.gateway', 'myfatoorah'),
            'payment_reference' => $orderNumber,
        ]);

        $cart->items()->delete();
        $cart->update(['status' => CartStatus::Converted]);

        $order = $order->fresh([
            'vendorOrders.items',
            'vendorOrders.vendorAccount',
            'vendorOrders.shipment',
            'payment',
            'shippingAddress',
        ]);

        $this->reconciliation->assertOrderInvariants($order);

        $order->loadMissing('user');

        DB::afterCommit(function () use ($order): void {
            event(new OrderCreated($order));

            $this->analyticsEvents->record(
                AnalyticsEventType::CheckoutCompleted,
                user: $order->user,
                subjectType: 'order',
                subjectId: $order->id,
                payload: ['order_number' => $order->order_number],
            );

            foreach ($order->vendorOrders as $vendorOrder) {
                event(new VendorOrderReceived($vendorOrder));
            }
        });

        return $order;
    }

    private function findExistingIdempotentOrder(User $user, string $idempotencyKey): ?Order
    {
        return Order::query()
            ->where('user_id', $user->id)
            ->where('idempotency_key', $idempotencyKey)
            ->first();
    }

    /**
     * @return array{order: Order, created: false}
     */
    private function replayExistingOrder(Order $existing, string $payloadHash): array
    {
        if ($existing->idempotency_payload_hash !== $payloadHash) {
            throw new ConflictHttpException(__('diyar.checkout.idempotency_key_conflict'));
        }

        return [
            'order' => $existing->load([
                'vendorOrders.items',
                'vendorOrders.vendorAccount',
                'vendorOrders.shipment',
                'payment',
                'shippingAddress',
            ]),
            'created' => false,
        ];
    }

    private function isIdempotencyUniqueViolation(QueryException $exception): bool
    {
        $message = strtolower($exception->getMessage());

        return str_contains($message, 'unique')
            && (str_contains($message, 'idempotency') || str_contains($message, 'user_id'));
    }

    /**
     * @param  array<string, mixed>|null  $attribution
     * @return array<string, mixed>
     */
    private function buildAffiliateSnapshot(?array $attribution, string|float $lineSubtotal): array
    {
        if ($attribution === null) {
            return [];
        }

        $base = number_format((float) $lineSubtotal, 2, '.', '');
        $rate = number_format((float) $attribution['commission_rate_percent'], 2, '.', '');
        $amount = number_format((float) bcmul($base, bcdiv($rate, '100', 6), 4), 2, '.', '');

        return [
            'affiliate_profile_id' => $attribution['affiliate_profile_id'],
            'affiliate_link_id' => $attribution['affiliate_link_id'],
            'affiliate_click_id' => $attribution['affiliate_click_id'] ?? null,
            'affiliate_traffic_source' => $attribution['traffic_source'] ?? null,
            'affiliate_commission_rate' => $rate,
            'affiliate_commission_base' => $base,
            'affiliate_commission_amount' => $amount,
        ];
    }
}
