<?php

namespace Database\Factories;

use App\Enums\AddressType;
use App\Models\Address;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Address> */
class AddressFactory extends Factory
{
    protected $model = Address::class;

    public function definition(): array
    {
        return [
            'user_id' => User::factory(),
            'label' => fake()->randomElement(['المنزل', 'العمل', 'Home', 'Work']),
            'type' => fake()->randomElement(AddressType::values()),
            'recipient_name' => fake()->name(),
            'phone' => '9665'.fake()->numerify('########'),
            'city' => 'الرياض',
            'district' => 'حي الياسمين',
            'street' => 'شارع العليا',
            'building' => '12',
            'apartment' => '4',
            'is_default' => false,
        ];
    }

    public function default(): static
    {
        return $this->state(fn () => ['is_default' => true]);
    }
}
