<?php

namespace App\Services\Notifications;

use App\Enums\NotificationType;
use App\Enums\RoleName;
use App\Models\User;

final class NotificationCategoryRegistry
{
    /**
     * @return list<array{
     *     key: string,
     *     label: string,
     *     policy: string,
     *     channels: list<string>,
     *     channel_policies: array<string, bool>
     * }>
     */
    public function categoriesForUser(User $user): array
    {
        $roleNames = $this->resolveRoleNames($user);
        $categories = [];

        foreach ($this->configuredCategories() as $key => $definition) {
            if (! $this->userHasCategoryRole($roleNames, $definition['roles'] ?? [])) {
                continue;
            }

            $categories[] = $this->presentCategory($key, $definition);
        }

        return $categories;
    }

    public function categoryForType(NotificationType $type): string
    {
        $map = config('diyar.notifications.type_category_map', []);

        return is_string($map[$type->value] ?? null)
            ? $map[$type->value]
            : $type->category();
    }

    /**
     * @return list<string>
     */
    public function typesForCategory(string $category): array
    {
        $map = config('diyar.notifications.type_category_map', []);
        if (! is_array($map)) {
            return [];
        }

        return array_values(array_keys(array_filter(
            $map,
            fn ($mappedCategory) => $mappedCategory === $category,
        )));
    }

    public function policyForCategory(string $category): string
    {
        $definition = $this->configuredCategories()[$category] ?? [];

        return is_string($definition['policy'] ?? null) ? $definition['policy'] : 'optional';
    }

    /**
     * @return list<string>
     */
    public function channelsForCategory(string $category): array
    {
        $definition = $this->configuredCategories()[$category] ?? [];
        $channels = $definition['channels'] ?? ['in_app', 'email', 'push'];

        return array_values(array_filter($channels, fn ($channel) => is_string($channel)));
    }

    public function isChannelLocked(string $category, string $channel): bool
    {
        if ($channel === 'in_app' && $this->policyForCategory($category) === 'required_in_app') {
            return true;
        }

        return false;
    }

    /**
     * @return array<string, array<string, bool>>
     */
    public function defaultMatrix(): array
    {
        $matrix = [];

        foreach ($this->configuredCategories() as $key => $definition) {
            $matrix[$key] = [];
            foreach ($definition['channels'] ?? ['in_app', 'email', 'push'] as $channel) {
                $matrix[$key][$channel] = true;
            }
        }

        return $matrix;
    }

    /**
     * @return list<string>
     */
    private function resolveRoleNames(User $user): array
    {
        $user->loadMissing('roles');

        return $user->roles
            ->map(function ($role) {
                $name = $role->name;

                if ($name instanceof RoleName) {
                    return $name->value;
                }

                if ($name instanceof \BackedEnum) {
                    return $name->value;
                }

                return (string) $name;
            })
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $definition
     * @return array{
     *     key: string,
     *     label: string,
     *     policy: string,
     *     channels: list<string>,
     *     channel_policies: array<string, bool>
     * }
     */
    private function presentCategory(string $key, array $definition): array
    {
        $channels = $this->channelsForCategory($key);
        $channelPolicies = [];

        foreach ($channels as $channel) {
            $channelPolicies[$channel] = $this->isChannelLocked($key, $channel);
        }

        return [
            'key' => $key,
            'label' => (string) ($definition['label'] ?? $key),
            'policy' => $this->policyForCategory($key),
            'channels' => $channels,
            'channel_policies' => $channelPolicies,
            'filterable' => $this->typesForCategory($key) !== [],
        ];
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    private function configuredCategories(): array
    {
        $categories = config('diyar.notifications.categories', []);

        return is_array($categories) ? $categories : [];
    }

    /**
     * @param  list<string>  $userRoles
     * @param  list<string>  $categoryRoles
     */
    private function userHasCategoryRole(array $userRoles, array $categoryRoles): bool
    {
        if ($categoryRoles === []) {
            return true;
        }

        return array_intersect($userRoles, $categoryRoles) !== [];
    }
}
