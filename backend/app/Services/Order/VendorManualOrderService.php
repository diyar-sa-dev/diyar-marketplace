<?php

namespace App\Services\Order;

use App\Enums\AddressType;
use App\Enums\OrderStatus;
use App\Enums\PaymentStatus;
use App\Enums\ShipmentStatus;
use App\Enums\VendorOrderStatus;
use App\Models\Address;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Shipment;
use App\Models\User;
use App\Models\VendorAccount;
use App\Models\VendorOrder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

final class VendorManualOrderService
{
    public function __construct(
        private readonly OrderNumberService $orderNumbers,
    ) {}

    /**
     * @param  array{
     *   customer_name: string,
     *   vendor_total: string|float,
     *   items_count: int,
     *   status: string,
     *   payment_status: string,
     *   customer_phone?: string|null,
     *   customer_email?: string|null,
     * }  $payload
     */
    public function create(User $vendorUser, VendorAccount $vendorAccount, array $payload): VendorOrder
    {
        $product = Product::query()
            ->where('vendor_account_id', $vendorAccount->id)
            ->orderBy('created_at')
            ->first();

        if ($product === null) {
            throw new UnprocessableEntityHttpException(__('diyar.order.manual_requires_product'));
        }

        return DB::transaction(function () use ($vendorUser, $vendorAccount, $payload, $product): VendorOrder {
            $total = number_format((float) $payload['vendor_total'], 2, '.', '');
            $itemsCount = max(1, (int) $payload['items_count']);
            $lineSubtotal = bcdiv($total, (string) $itemsCount, 2);
            $remainder = bcsub($total, bcmul($lineSubtotal, (string) $itemsCount, 2), 2);

            $orderNumber = $this->orderNumbers->allocate();
            $vendorOrderStatus = VendorOrderStatus::from($payload['status']);
            $paymentStatus = PaymentStatus::from($payload['payment_status']);

            $address = Address::query()->create([
                'user_id' => $vendorUser->id,
                'label' => 'Manual Order',
                'type' => AddressType::Home->value,
                'recipient_name' => $payload['customer_name'],
                'phone' => $payload['customer_phone'] ?? '—',
                'city' => '—',
                'district' => null,
                'street' => null,
                'building' => null,
                'apartment' => null,
                'is_default' => false,
            ]);

            $order = Order::query()->create([
                'user_id' => $vendorUser->id,
                'order_number' => $orderNumber,
                'status' => OrderStatus::Confirmed,
                'shipping_address_id' => $address->id,
                'shipping_recipient_name' => $payload['customer_name'],
                'shipping_phone' => $payload['customer_phone'] ?? '—',
                'customer_email' => $payload['customer_email'] ?? null,
                'shipping_city' => null,
                'shipping_district' => null,
                'shipping_street' => null,
                'shipping_building' => null,
                'shipping_apartment' => null,
                'subtotal' => $total,
                'shipping_total' => '0.00',
                'assembly_total' => '0.00',
                'discount_total' => '0.00',
                'vat_amount' => '0.00',
                'grand_total' => $total,
                'idempotency_key' => 'manual-'.Str::uuid(),
                'idempotency_payload_hash' => hash('sha256', json_encode($payload, JSON_THROW_ON_ERROR)),
            ]);

            $vendorOrder = VendorOrder::query()->create([
                'order_id' => $order->id,
                'vendor_account_id' => $vendorAccount->id,
                'status' => $vendorOrderStatus,
                'subtotal' => $total,
                'shipping_method' => 'carrier',
                'shipping_cost' => '0.00',
                'pickup_location_label' => null,
                'free_shipping_applied' => false,
                'assembly_cost' => '0.00',
                'discount_amount' => '0.00',
                'vat_amount' => '0.00',
                'vendor_total' => $total,
            ]);

            for ($index = 0; $index < $itemsCount; $index++) {
                $lineTotal = $index === 0 ? bcadd($lineSubtotal, $remainder, 2) : $lineSubtotal;

                OrderItem::query()->create([
                    'vendor_order_id' => $vendorOrder->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_slug' => $product->slug,
                    'unit_price' => $lineTotal,
                    'quantity' => 1,
                    'line_subtotal' => $lineTotal,
                    'color_name' => null,
                    'color_hex' => null,
                ]);
            }

            Shipment::query()->create([
                'vendor_order_id' => $vendorOrder->id,
                'status' => $this->resolveInitialShipmentStatus($vendorOrderStatus),
            ]);

            Payment::query()->create([
                'order_id' => $order->id,
                'status' => $paymentStatus,
                'amount' => $total,
                'currency' => config('diyar.payments.currency', 'SAR'),
                'gateway' => 'manual',
                'payment_method' => 'manual',
                'payment_reference' => 'MAN-'.$orderNumber,
                'paid_at' => $paymentStatus === PaymentStatus::Paid ? now() : null,
            ]);

            return $vendorOrder->fresh([
                'items.product.images.mediaFile',
                'order.payment',
                'order.user',
                'order.shippingAddress',
                'shipment',
                'vendorAccount',
            ]);
        });
    }

    private function resolveInitialShipmentStatus(VendorOrderStatus $status): ShipmentStatus
    {
        return match ($status) {
            VendorOrderStatus::Processing, VendorOrderStatus::Accepted => ShipmentStatus::Prepared,
            VendorOrderStatus::Shipped => ShipmentStatus::Shipped,
            VendorOrderStatus::Delivered => ShipmentStatus::Delivered,
            VendorOrderStatus::Cancelled => ShipmentStatus::Cancelled,
            default => ShipmentStatus::Pending,
        };
    }
}
