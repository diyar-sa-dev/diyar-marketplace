<?php

namespace App\Services\Finance;

use App\Enums\CommissionScope;
use App\Models\CommissionRule;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\VendorOrder;
use App\Services\Finance\DTO\CommissionResolution;
use Illuminate\Support\Carbon;

final class CommissionResolver
{
    /**
     * Commission base = vendor line subtotals (product value).
     * Precedence per line item: Product > Vendor > Category > Global.
     */
    public function resolveForVendorOrder(VendorOrder $vendorOrder): CommissionResolution
    {
        $vendorOrder->loadMissing(['items.product']);

        $totalCommission = '0.00';
        $totalBase = '0.00';
        $appliedRate = '0.00';
        $appliedScope = CommissionScope::Global->value;
        $appliedScopeId = null;

        foreach ($vendorOrder->items as $item) {
            $lineBase = number_format((float) $item->line_subtotal, 2, '.', '');
            $rule = $this->resolveRuleForLineItem($item, $vendorOrder);
            $rate = number_format((float) $rule->rate_percent, 2, '.', '');
            $lineCommission = $this->calculateCommission($lineBase, $rate);

            $totalCommission = bcadd($totalCommission, $lineCommission, 2);
            $totalBase = bcadd($totalBase, $lineBase, 2);

            if ($item === $vendorOrder->items->first()) {
                $appliedRate = $rate;
                $appliedScope = $rule->scope->value;
                $appliedScopeId = $rule->scope_id;
            }
        }

        if ($vendorOrder->items->isEmpty()) {
            $base = number_format((float) $vendorOrder->subtotal, 2, '.', '');
            $rule = $this->resolveVendorRule($vendorOrder->vendor_account_id)
                ?? $this->resolveGlobalRule();
            $rate = number_format((float) $rule->rate_percent, 2, '.', '');
            $totalCommission = $this->calculateCommission($base, $rate);
            $totalBase = $base;
            $appliedRate = $rate;
            $appliedScope = $rule->scope->value;
            $appliedScopeId = $rule->scope_id;
        }

        return new CommissionResolution(
            ratePercent: $appliedRate,
            commissionAmount: $totalCommission,
            commissionBase: $totalBase,
            scope: $appliedScope,
            scopeId: $appliedScopeId,
        );
    }

    private function resolveRuleForLineItem(OrderItem $item, VendorOrder $vendorOrder): CommissionRule
    {
        $product = $item->product ?? Product::query()->find($item->product_id);

        if ($product !== null) {
            $productRule = $this->resolveProductRule($product->id);
            if ($productRule !== null) {
                return $productRule;
            }

            $categoryRule = $this->resolveCategoryRule($product->category_id);
            if ($categoryRule !== null) {
                return $categoryRule;
            }
        }

        $vendorRule = $this->resolveVendorRule($vendorOrder->vendor_account_id);
        if ($vendorRule !== null) {
            return $vendorRule;
        }

        return $this->resolveGlobalRule();
    }

    public function activeGlobalRatePercent(): string
    {
        $rule = $this->activeRuleQuery(CommissionScope::Global, null)->first();

        if ($rule === null) {
            return '0.00';
        }

        return number_format((float) $rule->rate_percent, 2, '.', '');
    }

    private function resolveProductRule(string $productId): ?CommissionRule
    {
        return $this->activeRuleQuery(CommissionScope::Product, $productId)->first();
    }

    private function resolveCategoryRule(string $categoryId): ?CommissionRule
    {
        return $this->activeRuleQuery(CommissionScope::Category, $categoryId)->first();
    }

    private function resolveVendorRule(string $vendorAccountId): ?CommissionRule
    {
        return $this->activeRuleQuery(CommissionScope::Vendor, $vendorAccountId)->first();
    }

    private function resolveGlobalRule(): CommissionRule
    {
        $rule = $this->activeRuleQuery(CommissionScope::Global, null)->first();

        if ($rule === null) {
            throw new \RuntimeException(__('diyar.finance.commission_rule_missing'));
        }

        return $rule;
    }

    private function activeRuleQuery(CommissionScope $scope, ?string $scopeId)
    {
        $now = Carbon::now();

        return CommissionRule::query()
            ->where('scope', $scope->value)
            ->when(
                $scope === CommissionScope::Global,
                fn ($query) => $query->whereNull('scope_id'),
                fn ($query) => $query->where('scope_id', $scopeId),
            )
            ->where('is_active', true)
            ->where(function ($query) use ($now) {
                $query->whereNull('effective_from')->orWhere('effective_from', '<=', $now);
            })
            ->where(function ($query) use ($now) {
                $query->whereNull('effective_to')->orWhere('effective_to', '>=', $now);
            })
            ->orderByDesc('created_at');
    }

    private function calculateCommission(string $base, string $ratePercent): string
    {
        if (bccomp($base, '0.00', 2) <= 0) {
            return '0.00';
        }

        if (bccomp($ratePercent, '0.00', 2) < 0 || bccomp($ratePercent, '100.00', 2) > 0) {
            throw new \InvalidArgumentException(__('diyar.finance.invalid_commission_rate'));
        }

        return bcmul($base, bcdiv($ratePercent, '100', 6), 2);
    }
}
