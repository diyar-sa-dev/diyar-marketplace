<?php

namespace App\Services\Finance;

use App\Models\FinancialTransaction;
use App\Services\Finance\DTO\VendorFinancePeriodReport;
use App\Support\Locale\LocalizedFinanceDateFormatter;
use Illuminate\Support\Collection;

final class VendorFinanceExportService
{
    /**
     * @param  Collection<int, FinancialTransaction>  $transactions
     */
    public function stream(VendorFinancePeriodReport $report, Collection $transactions): void
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
            __('diyar.finance.export.adjustments'),
            __('diyar.finance.export.net_earnings'),
            __('diyar.finance.export.pending_escrow'),
            __('diyar.finance.export.available_balance'),
            __('diyar.finance.export.paid_out'),
            __('diyar.finance.export.completed_orders'),
            __('diyar.finance.export.average_order_value'),
        ]);

        fputcsv($handle, [
            __('diyar.finance.periods.'.$report->periodType->value),
            LocalizedFinanceDateFormatter::format($report->from),
            LocalizedFinanceDateFormatter::format($report->to),
            $report->grossSales,
            $report->commission,
            $report->refunds,
            $report->adjustments,
            $report->netEarnings,
            $report->pendingEscrow,
            $report->availableBalance,
            $report->paidOut,
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
                $this->transactionLabel($transaction),
                $transaction->order?->order_number ?? '',
                __('diyar.finance.directions.'.$transaction->direction->value),
                number_format((float) $transaction->amount, 2, '.', ''),
                $transaction->currency,
                LocalizedFinanceDateFormatter::format($transaction->created_at),
            ]);
        }

        fclose($handle);
    }

    private function transactionLabel(FinancialTransaction $transaction): string
    {
        $key = 'diyar.finance.transaction_types.'.$transaction->transaction_type->value;
        $label = __($key);

        if ($label !== $key) {
            return $label;
        }

        return $transaction->transaction_type->value;
    }
}
