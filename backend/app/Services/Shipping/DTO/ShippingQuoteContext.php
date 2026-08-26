<?php

namespace App\Services\Shipping\DTO;

use App\Models\Address;
use App\Models\Product;
use Illuminate\Support\Collection;

final readonly class ShippingQuoteContext
{
    /**
     * @param  Collection<int, object{product: Product, quantity: int}>  $cartItems
     */
    public function __construct(
        public Address $address,
        public Collection $cartItems,
        public string $vendorAccountId,
    ) {}
}
