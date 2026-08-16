<?php

namespace Database\Factories;

use App\Enums\UserStatus;
use App\Models\User;
use App\Services\Identity\PhoneNormalizer;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<User>
 */
class UserFactory extends Factory
{
    protected static ?string $password = null;

    /**
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $national = '5'.fake()->numerify('########');

        return [
            'name' => fake()->name(),
            'phone' => PhoneNormalizer::normalize($national),
            'email' => fake()->unique()->safeEmail(),
            'email_verified_at' => now(),
            'phone_verified_at' => now(),
            'password' => static::$password ??= 'Password123!',
            'status' => UserStatus::Active,
            'remember_token' => Str::random(10),
        ];
    }

    public function pending(): static
    {
        return $this->state(fn () => [
            'status' => UserStatus::Pending,
            'phone_verified_at' => null,
        ]);
    }

    public function unverifiedEmail(): static
    {
        return $this->state(fn () => [
            'email_verified_at' => null,
        ]);
    }
}
