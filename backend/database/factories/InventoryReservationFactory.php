<?php

namespace Database\Factories;

use App\Enums\ReservationStatus;
use App\Models\InventoryReservation;
use App\Models\Product;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<InventoryReservation> */
class InventoryReservationFactory extends Factory
{
    protected $model = InventoryReservation::class;

    public function definition(): array
    {
        return [
            'product_id' => Product::factory(),
            'user_id' => User::factory(),
            'quantity' => fake()->numberBetween(1, 3),
            'status' => ReservationStatus::Pending,
            'affects_inventory' => true,
            'expires_at' => now()->addMinutes(15),
        ];
    }

    public function finalized(): static
    {
        return $this->state(fn () => [
            'status' => ReservationStatus::Finalized,
            'finalized_at' => now(),
        ]);
    }

    public function released(): static
    {
        return $this->state(fn () => [
            'status' => ReservationStatus::Released,
            'released_at' => now(),
        ]);
    }

    public function expired(): static
    {
        return $this->state(fn () => [
            'status' => ReservationStatus::Expired,
            'expires_at' => now()->subMinute(),
            'released_at' => now(),
        ]);
    }
}
