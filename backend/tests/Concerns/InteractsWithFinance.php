<?php

namespace Tests\Concerns;

use Database\Seeders\CommissionRuleSeeder;

trait InteractsWithFinance
{
    protected function seedCommissionRules(): void
    {
        $this->seed(CommissionRuleSeeder::class);
    }
}
