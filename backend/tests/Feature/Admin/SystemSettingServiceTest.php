<?php

namespace Tests\Feature\Admin;

use App\Enums\SystemSettingGroup;
use App\Enums\SystemSettingType;
use App\Models\SystemSetting;
use App\Services\Affiliate\AffiliatePlatformConfigService;
use App\Services\Settings\EffectiveConfigService;
use App\Services\Settings\SystemSettingService;
use Database\Seeders\SystemSettingSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;
use InvalidArgumentException;
use Tests\TestCase;

class SystemSettingServiceTest extends TestCase
{
    use RefreshDatabase;

    private SystemSettingService $service;

    private EffectiveConfigService $config;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = app(SystemSettingService::class);
        $this->config = app(EffectiveConfigService::class);
    }

    public function test_validate_rejects_invalid_decimal_value(): void
    {
        $this->expectException(ValidationException::class);

        $this->service->validate('not-a-number', SystemSettingType::Decimal, ['required', 'numeric']);
    }

    public function test_validate_casts_boolean_values(): void
    {
        $this->assertTrue($this->service->validate(true, SystemSettingType::Boolean, ['required', 'boolean']));
        $this->assertFalse($this->service->validate(false, SystemSettingType::Boolean, ['required', 'boolean']));
    }

    public function test_validate_casts_string_boolean_values(): void
    {
        $this->assertTrue($this->service->validate('true', SystemSettingType::Boolean, ['required', 'boolean']));
        $this->assertFalse($this->service->validate('false', SystemSettingType::Boolean, ['required', 'boolean']));
    }

    public function test_set_persists_value_in_transaction(): void
    {
        $setting = $this->service->set(
            group: SystemSettingGroup::Affiliate,
            key: 'payout_minimum',
            value: '150.00',
            type: SystemSettingType::Decimal,
            rules: ['required', 'numeric', 'min:0'],
        );

        $this->assertEquals(150.0, $setting->rawValue());
        $this->assertDatabaseHas('system_settings', [
            'group' => 'affiliate',
            'key' => 'payout_minimum',
        ]);
    }

    public function test_cache_invalidates_when_setting_changes(): void
    {
        SystemSetting::query()->create([
            'group' => SystemSettingGroup::Affiliate->value,
            'key' => 'payout_minimum',
            'value' => ['v' => '100.00'],
            'type' => SystemSettingType::Decimal->value,
            'is_public' => false,
        ]);

        $this->assertSame(100.0, $this->config->decimal('affiliate.payout_minimum'));

        $this->service->set(
            group: SystemSettingGroup::Affiliate,
            key: 'payout_minimum',
            value: '250.00',
            type: SystemSettingType::Decimal,
            rules: ['required', 'numeric', 'min:0'],
        );

        $this->assertSame(250.0, $this->config->decimal('affiliate.payout_minimum'));
    }

    public function test_sensitive_keys_cannot_be_marked_public(): void
    {
        $this->expectException(InvalidArgumentException::class);

        $this->service->set(
            group: SystemSettingGroup::Notifications,
            key: 'push_api_key',
            value: 'secret-value',
            type: SystemSettingType::String,
            isPublic: true,
        );
    }

    public function test_public_theme_endpoint_returns_only_public_theme_tokens(): void
    {
        $this->seed(SystemSettingSeeder::class);

        SystemSetting::query()
            ->where('group', SystemSettingGroup::Affiliate->value)
            ->where('key', 'payout_minimum')
            ->update(['is_public' => false]);

        $response = $this->getJson('/api/v1/platform/theme');

        $response->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure([
                'data' => [
                    'theme' => [
                        'primary_color',
                        'primary_dark',
                        'surface_color',
                    ],
                ],
            ])
            ->assertJsonMissing(['payout_minimum']);
    }

    public function test_effective_config_falls_back_to_env_config_when_row_missing(): void
    {
        config(['diyar.affiliate.payout_minimum' => '175.50']);

        Cache::flush();

        $this->assertSame(175.5, $this->config->decimal('affiliate.payout_minimum'));
    }

    public function test_affiliate_platform_config_service_uses_effective_config(): void
    {
        SystemSetting::query()->create([
            'group' => SystemSettingGroup::Affiliate->value,
            'key' => 'payout_minimum',
            'value' => ['v' => '222.00'],
            'type' => SystemSettingType::Decimal->value,
            'is_public' => false,
        ]);

        Cache::flush();

        $snapshot = app(AffiliatePlatformConfigService::class)->snapshot();

        $this->assertSame('222.00', $snapshot['payout_minimum']);
    }
}
