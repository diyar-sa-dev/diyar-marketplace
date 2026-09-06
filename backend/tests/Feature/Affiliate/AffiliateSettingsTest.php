<?php

namespace Tests\Feature\Affiliate;

use App\Enums\RoleName;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class AffiliateSettingsTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    #[Test]
    public function marketer_can_update_payout_bank_details(): void
    {
        $marketer = $this->createUserWithRole(RoleName::Marketer);

        $this->patchJsonAsUser('/api/v1/dashboard/affiliate/settings', $marketer, [
            'payout_account_holder' => 'Marketer One',
            'payout_bank_code' => 'snb',
            'payout_bank_name' => 'Saudi National Bank (SNB)',
            'payout_iban' => 'SA0380000000608010167519',
        ])
            ->assertOk()
            ->assertJsonPath('data.profile.payout_account_holder', 'Marketer One')
            ->assertJsonPath('data.profile.payout_iban', 'SA0380000000608010167519')
            ->assertJsonPath('data.profile.payout_bank_code', 'snb');
    }

    #[Test]
    public function marketer_bank_details_reject_invalid_iban(): void
    {
        $marketer = $this->createUserWithRole(RoleName::Marketer);

        $this->patchJsonAsUser('/api/v1/dashboard/affiliate/settings', $marketer, [
            'payout_account_holder' => 'Marketer One',
            'payout_iban' => 'ZAE',
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['payout_iban']);
    }

    #[Test]
    public function marketer_social_links_reject_invalid_url(): void
    {
        $marketer = $this->createUserWithRole(RoleName::Marketer);

        $this->patchJsonAsUser('/api/v1/dashboard/affiliate/settings', $marketer, [
            'social_links' => [
                'twitter' => 'not-a-url',
            ],
        ])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['social_links.twitter']);
    }

    #[Test]
    public function marketer_can_save_valid_social_links(): void
    {
        $marketer = $this->createUserWithRole(RoleName::Marketer);

        $this->patchJsonAsUser('/api/v1/dashboard/affiliate/settings', $marketer, [
            'social_links' => [
                'twitter' => 'https://twitter.com/diyar',
                'website' => 'https://example.com',
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.profile.social_links.twitter', 'https://twitter.com/diyar')
            ->assertJsonPath('data.profile.social_links.website', 'https://example.com');
    }
}
