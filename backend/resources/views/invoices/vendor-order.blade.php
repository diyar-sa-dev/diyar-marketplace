<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
    <meta charset="utf-8">
    <title>فاتورة {{ $order->order_number }}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 32px; color: #1f2937; }
        h1 { font-size: 22px; margin-bottom: 4px; }
        .muted { color: #6b7280; font-size: 13px; }
        table { width: 100%; border-collapse: collapse; margin-top: 24px; }
        th, td { border-bottom: 1px solid #e5e7eb; padding: 10px 8px; text-align: right; }
        th { background: #f9fafb; font-size: 13px; }
        .total { margin-top: 20px; text-align: left; font-size: 18px; font-weight: bold; }
    </style>
</head>
<body>
    <h1>فاتورة طلب {{ $order->order_number }}</h1>
    <p class="muted">{{ $vendorOrder->created_at?->format('Y-m-d') }}</p>

    <p><strong>العميل:</strong> {{ $order->shipping_recipient_name }}</p>
    <p><strong>البائع:</strong> {{ $vendorOrder->vendorAccount->business_name ?? '—' }}</p>

    <table>
        <thead>
            <tr>
                <th>المنتج</th>
                <th>الكمية</th>
                <th>السعر</th>
                <th>الإجمالي</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($vendorOrder->items as $item)
                <tr>
                    <td>{{ $item->product_name }}</td>
                    <td>{{ $item->quantity }}</td>
                    <td>{{ number_format((float) $item->unit_price, 2) }} ر.س</td>
                    <td>{{ number_format((float) $item->line_subtotal, 2) }} ر.س</td>
                </tr>
            @endforeach
        </tbody>
    </table>

    <p class="total">الإجمالي: {{ number_format((float) $vendorOrder->vendor_total, 2) }} ر.س</p>
    <p class="muted">حالة الدفع: {{ $order->payment?->status->value ?? '—' }}</p>

    <script>window.print();</script>
</body>
</html>
