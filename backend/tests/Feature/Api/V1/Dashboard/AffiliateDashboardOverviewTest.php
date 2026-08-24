<?php

namespace Tests\Feature\Api\V1\Dashboard;

use App\Enums\RoleName;
use Illuminate\Foundation\Testing\RefreshDatabase;
use PHPUnit\Framework\Attributes\Test;
use Tests\Concerns\InteractsWithIdentity;
use Tests\TestCase;

class AffiliateDashboardOverviewTest extends TestCase
{
    use InteractsWithIdentity;
    use RefreshDatabase;

    #[Test]
    public function marketer_can_load_affiliate_dashboard_overview(): void
    {
        $marketer = $this->createUserWithRole(RoleName::Marketer);

        $this->getJsonAsUser('/api/v1/dashboard/affiliate', $marketer)
            ->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'profile' => ['id', 'referral_code', 'status'],
                    'overview' => [
                        'balance',
                        'clicks',
                        'conversions',
                        'conversion_rate',
                        'earnings',
                        'active_links',
                        'period',
                        'chart',
                        'top_links',
                    ],
                ],
            ]);
    }
}
