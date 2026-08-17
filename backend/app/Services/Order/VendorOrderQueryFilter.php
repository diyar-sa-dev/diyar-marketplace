<?php

namespace App\Services\Order;

use App\Enums\VendorOrderStatus;
use App\Models\VendorOrder;
use Illuminate\Database\Eloquent\Builder;

final class VendorOrderQueryFilter
{
    /**
     * @param  Builder<VendorOrder>  $query
     */
    public function applyStatusFilter(Builder $query, string $status): void
    {
        if ($status === '' || $status === 'all') {
            return;
        }

        $statuses = match ($status) {
            'processing' => [
                VendorOrderStatus::Processing->value,
                VendorOrderStatus::Accepted->value,
            ],
            default => [$status],
        };

        $query->whereIn('status', $statuses);
    }

    /**
     * @param  Builder<VendorOrder>  $query
     */
    public function applySearchFilter(Builder $query, string $search): void
    {
        $search = trim($search);

        if ($search === '') {
            return;
        }

        $like = '%'.$search.'%';
        $statuses = $this->resolveStatusesFromSearch($search);

        $query->where(function (Builder $builder) use ($like, $statuses) {
            $builder
                ->whereHas('order', fn (Builder $orderQuery) => $orderQuery
                    ->where('order_number', 'like', $like)
                    ->orWhere('shipping_recipient_name', 'like', $like))
                ->orWhere('id', 'like', $like);

            if ($statuses !== []) {
                $builder->orWhereIn('status', $statuses);
            }
        });
    }

    /**
     * @return list<string>
     */
    private function resolveStatusesFromSearch(string $search): array
    {
        $normalized = mb_strtolower(trim($search));

        $keywords = [
            VendorOrderStatus::Accepted->value => [
                'accepted',
                'accept',
                'مقبول',
                'قبول',
            ],
            VendorOrderStatus::Pending->value => [
                'pending',
                'بانتظار',
                'تأكيد',
            ],
            VendorOrderStatus::Processing->value => [
                'processing',
                'process',
                'تحضير',
                'قيد التحضير',
                'قيد',
            ],
            VendorOrderStatus::Shipped->value => [
                'shipped',
                'ship',
                'شحن',
                'تم الشحن',
            ],
            VendorOrderStatus::Delivered->value => [
                'delivered',
                'deliver',
                'تسليم',
                'تم التسليم',
                'توصيل',
            ],
            VendorOrderStatus::Cancelled->value => [
                'cancelled',
                'cancel',
                'ملغ',
                'إلغاء',
            ],
        ];

        $matched = [];

        foreach ($keywords as $status => $terms) {
            foreach ($terms as $term) {
                if ($normalized === mb_strtolower($term) || str_contains($normalized, mb_strtolower($term))) {
                    $matched[] = $status;
                    break;
                }
            }
        }

        if (in_array(VendorOrderStatus::Processing->value, $matched, true)
            && ! in_array(VendorOrderStatus::Accepted->value, $matched, true)) {
            $matched[] = VendorOrderStatus::Accepted->value;
        }

        return array_values(array_unique($matched));
    }
}
