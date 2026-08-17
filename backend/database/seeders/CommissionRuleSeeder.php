<?php

namespace Database\Seeders;

use App\Enums\CommissionScope;
use App\Models\CommissionRule;
use Illuminate\Database\Seeder;

class CommissionRuleSeeder extends Seeder
{
    public function run(): void
    {
        CommissionRule::query()->updateOrCreate(
            [
                'scope' => CommissionScope::Global,
                'scope_id' => null,
            ],
            [
                'rate_percent' => '10.00',
                'is_active' => true,
            ],
        );
    }
}
