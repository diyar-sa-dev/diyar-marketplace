<?php

namespace App\Http\Requests\Checkout;

class StoreOrderRequest extends CheckoutPreviewRequest
{
    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return array_merge(parent::rules(), [
            'idempotency_key' => ['prohibited'],
        ]);
    }

    public function idempotencyKey(): string
    {
        $key = (string) $this->header('Idempotency-Key', '');

        if ($key === '') {
            abort(response()->json([
                'success' => false,
                'message' => __('diyar.checkout.idempotency_key_required'),
            ], 422));
        }

        return $key;
    }

    public function payloadHash(): string
    {
        $payload = [
            'shipping_address_id' => $this->input('shipping_address_id'),
            'vendor_delivery_selections' => collect($this->input('vendor_delivery_selections', []))
                ->sortBy('vendor_account_id')
                ->values()
                ->all(),
        ];

        return hash('sha256', json_encode($payload, JSON_THROW_ON_ERROR));
    }
}
