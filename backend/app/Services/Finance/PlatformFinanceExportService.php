<?php

namespace App\Services\Finance;

use App\Models\FinancialTransaction;
use App\Services\Finance\DTO\PlatformFinancePeriodReport;
use App\Support\Locale\LocalizedFinanceDateFormatter;
use Illuminate\Support\Collection;

final class PlatformFinanceExportService
{
    /**
     * @param  Collection<int, FinancialTransaction>  $transactions
     */
    public function stream(PlatformFinancePeriodReport $report, Collection $transactions): void
    {
        $handle = fopen('php://output', 'wb');
        if ($handle === false) {
            return;
        }

        fwrite($handle, "\xEF\xBB\xBF");

        fputcsv($handle, [
            __('diyar.finance.export.period_type'),
            __('diyar.finance.export.period_from'),
            __('diyar.finance.export.period_to'),
            __('diyar.finance.export.gross_sales'),
            __('diyar.finance.export.commission'),
            __('diyar.finance.export.refunds'),
            __('diyar.finance.export.net_earnings'),
            __('diyar.finance.export.pending_escrow'),
            __('diyar.finance.export.platform_earnings'),
            __('diyar.finance.export.affiliate_commission'),
            __('diyar.finance.export.pending_vendor_payouts'),
            __('diyar.finance.export.pending_affiliate_payouts'),
            __('diyar.finance.export.completed_orders'),
            __('diyar.finance.export.average_order_value'),
        ]);

        fputcsv($handle, [
            __('diyar.finance.periods.'.$report->periodType->value),
            LocalizedFinanceDateFormatter::format($report->from),
            LocalizedFinanceDateFormatter::format($report->to),
            $report->grossSales,
            $report->platformCommission,
            $report->refunds,
            $report->netEarnings,
            $report->pendingEscrow,
            $report->platformEarnings,
            $report->affiliateCommission,
            $report->pendingVendorPayouts,
            $report->pendingAffiliatePayouts,
            (string) $report->completedOrders,
            $report->averageOrderValue,
        ]);

        fputcsv($handle, []);
        fputcsv($handle, [
            __('diyar.finance.export.reference'),
            __('diyar.finance.export.transaction'),
            __('diyar.finance.export.order_number'),
            __('diyar.finance.export.direction'),
            __('diyar.finance.export.amount'),
            __('diyar.finance.export.currency'),
            __('diyar.finance.export.date'),
        ]);

        foreach ($transactions as $transaction) {
            fputcsv($handle, [
                $transaction->reference,
                __('diyar.finance.transaction_types.'.$transaction->transaction_type->value),
                $transaction->order?->order_number ?? '',
                __('diyar.finance.directions.'.$transaction->direction->value),
                number_format((float) $transaction->amount, 2, '.', ''),
                $transaction->currency,
                LocalizedFinanceDateFormatter::format($transaction->created_at),
            ]);
        }

        fclose($handle);
    }
}
