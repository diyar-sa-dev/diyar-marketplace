<?php

namespace App\Services\Checkout;

use App\Enums\ShippingMethod;
use App\Models\Address;
use App\Models\Cart;
use App\Models\User;
use App\Services\Cart\CartService;
use App\Services\Cart\CartValidationService;
use App\Services\Coupon\CheckoutCouponService;
use App\Services\Profile\AddressService;
use App\Services\Shipping\DTO\ShippingQuoteContext;
use App\Services\Shipping\ShippingQuoteService;
use App\Services\Shipping\VendorShippingSettingsService;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

final class CheckoutPreviewService
{
    public function __construct(
        private readonly CartService $cartService,
        private readonly CartValidationService $cartValidation,
        private readonly AddressService $addresses,
        private readonly VendorGroupService $vendorGroups,
        private readonly VendorShippingSettingsService $shippingSettings,
        private readonly ShippingQuoteService $shippingQuotes,
        private readonly VatCalculator $vat,
        private readonly AssemblyCalculator $assembly,
        private readonly CheckoutCouponService $coupons,
    ) {}

    /**
     * @param  list<array{vendor_account_id: string, method: string}>  $deliverySelections
     * @param  list<array{vendor_account_id: string, code: string}>  $vendorCoupons
     * @return array<string, mixed>
     */
    public function preview(
        User $user,
        string $shippingAddressId,
        array $deliverySelections,
        array $vendorCoupons = [],
    ): array {
        $address = $this->addresses->findOwnedAddress($user, $shippingAddressId);
        $cart = $this->cartService->loadCart($this->cartService->resolveForUser($user));

        if ($cart->items->isEmpty()) {
            throw new UnprocessableEntityHttpException(__('diyar.checkout.cart_empty'));
        }

        $validation = $this->cartValidation->validate($cart);

        if (! $validation['valid']) {
            return $this->buildInvalidPreview($cart, $validation, $address);
        }

        $selectionMap = $this->normalizeSelections($deliverySelections);
        $groups = $this->vendorGroups->groupCartItems($cart);
        $this->assertCompleteSelections($groups->keys()->all(), $selectionMap);

        $vendorSubtotals = [];
        foreach ($groups as $vendorAccountId => $items) {
            $vendorSubtotals[(string) $vendorAccountId] = $this->vendorGroups->vendorSubtotal($items);
        }

        $couponMap = $this->normalizeCoupons($vendorCoupons);
        $cartItemsByVendor = [];
        foreach ($groups as $vendorAccountId => $items) {
            $cartItemsByVendor[(string) $vendorAccountId] = $items;
        }
        $appliedCoupons = $this->coupons->resolveForVendorGroups($couponMap, $vendorSubtotals, $cartItemsByVendor, $user);

        $vendorGroupResults = [];
        $orderSubtotal = '0.00';
        $orderShipping = '0.00';
        $orderAssembly = '0.00';
        $orderDiscount = '0.00';
        $vendorVatAmounts = [];

        foreach ($groups as $vendorAccountId => $items) {
            $vendorAccountId = (string) $vendorAccountId;
            $firstItem = $items->first();
            $vendor = $firstItem->product->vendorAccount;
            $subtotal = $this->vendorGroups->vendorSubtotal($items);

            $settings = $this->shippingSettings->requireForCheckout($vendorAccountId);
            $method = ShippingMethod::from($selectionMap[$vendorAccountId]);
            $available = $this->shippingQuotes->availableMethods($settings);

            if (! in_array($method, $available, true)) {
                throw new UnprocessableEntityHttpException(__('diyar.shipping.method_not_available'));
            }

            $quote = $this->shippingQuotes->quoteVendorGroup(
                $settings,
                $method,
                $subtotal,
                new ShippingQuoteContext($address, $items, $vendorAccountId),
            );
            $assemblyCost = $this->assembly->calculate($subtotal, $items->count());
            $couponData = $appliedCoupons[$vendorAccountId] ?? null;
            $discount = $couponData['discount'] ?? '0.00';
            $coupon = $couponData['coupon'] ?? null;
            $vatAmount = $this->vat->calculateForVendor($subtotal, $quote->shippingCost, $discount);
            $vendorTotal = bcadd(bcadd(bcadd($subtotal, $quote->shippingCost, 2), $assemblyCost, 2), $vatAmount, 2);
            $vendorTotal = bcsub($vendorTotal, $discount, 2);

            $orderDiscount = bcadd($orderDiscount, $discount, 2);

            $vendorVatAmounts[] = $vatAmount;
            $orderSubtotal = bcadd($orderSubtotal, $subtotal, 2);
            $orderShipping = bcadd($orderShipping, $quote->shippingCost, 2);
            $orderAssembly = bcadd($orderAssembly, $assemblyCost, 2);

            $vendorGroupResults[] = [
                'vendor_account_id' => $vendorAccountId,
                'vendor_name' => $vendor->business_name,
                'items' => $items->map(fn ($item) => [
                    'item_id' => $item->id,
                    'product_id' => $item->product_id,
                    'product_name' => $item->product->name,
                    'quantity' => $item->quantity,
                    'unit_price' => (string) $item->unit_price_snapshot,
                    'line_subtotal' => $this->vendorGroups->lineSubtotal($item),
                    'color' => [
                        'name' => $item->color_name ?: null,
                        'hex_code' => $item->color_hex,
                    ],
                ])->values()->all(),
                'subtotal' => $subtotal,
                'available_methods' => array_map(fn (ShippingMethod $m) => $m->value, $available),
                'selected_method' => $method->value,
                'shipping' => [
                    'method' => $quote->method->value,
                    'cost' => $quote->shippingCost,
                    'free_shipping_applied' => $quote->freeShippingApplied,
                    'pickup_location_label' => $quote->pickupLocationLabel,
                    'delivery_estimate_days' => $quote->deliveryEstimateDays,
                    'billable_weight_kg' => $quote->billableWeightKg,
                ],
                'assembly' => $assemblyCost,
                'discount' => $discount,
                'coupon' => $coupon !== null ? [
                    'id' => $coupon->id,
                    'code' => $coupon->code,
                    'type' => $coupon->type->value,
                    'value' => $coupon->value,
                    'maximum_discount' => $coupon->maximum_discount !== null
                        ? (string) $coupon->maximum_discount
                        : null,
                ] : null,
                'vat' => $vatAmount,
                'vendor_total' => $vendorTotal,
            ];
        }

        $orderVat = $this->vat->sumWithRemainder($vendorVatAmounts);
        $grandTotal = bcadd(bcadd(bcadd($orderSubtotal, $orderShipping, 2), $orderAssembly, 2), $orderVat, 2);
        $grandTotal = bcsub($grandTotal, $orderDiscount, 2);

        return [
            'valid' => true,
            'cart' => [
                'id' => $cart->id,
                'item_count' => $this->cartService->itemCount($cart),
            ],
            'validation' => $validation,
            'shipping_address_id' => $address->id,
            'vendor_groups' => $vendorGroupResults,
            'totals' => [
                'subtotal' => $orderSubtotal,
                'shipping' => $orderShipping,
                'assembly' => $orderAssembly,
                'discount' => $orderDiscount,
                'vat' => $orderVat,
                'total' => $grandTotal,
            ],
        ];
    }

    /**
     * @param  list<array{vendor_account_id: string, method: string}>  $deliverySelections
     * @return array<string, string>
     */
    private function normalizeSelections(array $deliverySelections): array
    {
        $map = [];

        foreach ($deliverySelections as $selection) {
            $vendorId = (string) $selection['vendor_account_id'];
            if (isset($map[$vendorId])) {
                throw new UnprocessableEntityHttpException(__('diyar.checkout.incomplete_delivery_selections'));
            }
            $map[$vendorId] = (string) $selection['method'];
        }

        return $map;
    }

    /**
     * @param  list<array{vendor_account_id: string, code?: string|null}>  $vendorCoupons
     * @return array<string, string>
     */
    private function normalizeCoupons(array $vendorCoupons): array
    {
        $map = [];

        foreach ($vendorCoupons as $entry) {
            $vendorId = (string) ($entry['vendor_account_id'] ?? '');
            $code = trim((string) ($entry['code'] ?? ''));

            if ($vendorId === '' || $code === '') {
                continue;
            }

            if (isset($map[$vendorId])) {
                throw new UnprocessableEntityHttpException(__('diyar.coupons.duplicate_vendor_entry'));
            }

            $map[$vendorId] = $code;
        }

        return $map;
    }

    /**
     * @param  list<string>  $vendorIds
     * @param  array<string, string>  $selectionMap
     */
    private function assertCompleteSelections(array $vendorIds, array $selectionMap): void
    {
        sort($vendorIds);
        $selectedIds = array_keys($selectionMap);
        sort($selectedIds);

        if ($vendorIds !== $selectedIds) {
            throw new UnprocessableEntityHttpException(__('diyar.checkout.incomplete_delivery_selections'));
        }
    }

    /**
     * @param  array<string, mixed>  $validation
     * @return array<string, mixed>
     */
    private function buildInvalidPreview(Cart $cart, array $validation, Address $address): array
    {
        return [
            'valid' => false,
            'cart' => [
                'id' => $cart->id,
                'item_count' => $this->cartService->itemCount($cart),
            ],
            'validation' => $validation,
            'shipping_address_id' => $address->id,
            'vendor_groups' => [],
            'totals' => [
                'subtotal' => $validation['totals']['subtotal'],
                'shipping' => null,
                'assembly' => null,
                'discount' => null,
                'vat' => null,
                'total' => null,
            ],
        ];
    }
}
