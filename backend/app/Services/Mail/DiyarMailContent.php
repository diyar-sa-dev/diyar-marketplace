<?php

namespace App\Services\Mail;

use App\Enums\RoleName;
use App\Models\User;

final class DiyarMailContent
{
    public function otpVerificationBody(string $locale, string $recipientName, string $code, int $minutes): string
    {
        $greeting = $locale === 'ar'
            ? 'مرحباً '.e($recipientName).','
            : 'Hello '.e($recipientName).',';

        $intro = $locale === 'ar'
            ? 'استخدم الرمز التالي للتحقق من بريدك الإلكتروني على منصة ديار:'
            : 'Use the code below to verify your email address on Diyar:';

        $expiry = $locale === 'ar'
            ? "ينتهي الرمز خلال {$minutes} دقائق. لا تشاركه مع أي شخص."
            : "This code expires in {$minutes} minutes. Never share it with anyone.";

        $otpLabel = $locale === 'ar' ? 'رمز التحقق' : 'Verification code';

        $otpLabelStyle = $locale === 'ar'
            ? 'font-size:13px;font-weight:700;color:#856b54;margin-bottom:8px;'
            : 'font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#856b54;margin-bottom:8px;';

        return <<<HTML
<p style="margin:0 0 16px;font-size:16px;line-height:1.7;">{$greeting}</p>
<p style="margin:0 0 20px;font-size:15px;line-height:1.7;color:#4b5563;">{$intro}</p>
<div style="margin:0 0 24px;padding:20px 24px;background:linear-gradient(135deg,#faf7f2 0%,#f5ebe0 100%);border:2px dashed #d4b896;border-radius:16px;text-align:center;">
  <div style="{$otpLabelStyle}">{$otpLabel}</div>
  <div style="font-size:36px;font-weight:800;letter-spacing:0.35em;color:#2f241f;font-family:Consolas,Monaco,monospace;direction:ltr;unicode-bidi:isolate;">{$code}</div>
</div>
<p style="margin:0;font-size:13px;line-height:1.7;color:#6b7280;">{$expiry}</p>
HTML;
    }

    /**
     * @param  list<RoleName>  $roles
     */
    public function welcomeBody(string $locale, User $user, array $roles): string
    {
        $name = e($user->name);
        $phone = e($user->phone ?? '—');

        $roleLines = array_map(
            fn (RoleName $role) => $this->welcomeRoleLine($locale, $role),
            $roles,
        );

        $rolesHtml = implode('', array_map(
            fn (string $line) => '<li style="margin:0 0 10px;font-size:14px;line-height:1.7;color:#374151;">'.$line.'</li>',
            array_filter($roleLines),
        ));

        if ($locale === 'ar') {
            return <<<HTML
<p style="margin:0 0 16px;font-size:17px;line-height:1.7;">مرحباً <strong>{$name}</strong>،</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#4b5563;">يسعدنا انضمامك إلى <strong>ديار</strong>. رحلتك تبدأ من هنا — نحن بجانبك في كل خطوة.</p>
<div style="margin:0 0 20px;padding:16px 18px;background:#faf7f2;border-radius:14px;border:1px solid #ece7e1;">
  <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">رقم الجوال</p>
  <p style="margin:0;font-size:15px;font-weight:700;color:#2f241f;direction:ltr;text-align:right;unicode-bidi:isolate;">{$phone}</p>
</div>
<p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#2f241f;">ما الذي يمكنك فعله الآن؟</p>
<ul style="margin:0 0 16px;padding:0 20px 0 0;list-style-position:outside;">{$rolesHtml}</ul>
<p style="margin:0;font-size:14px;line-height:1.7;color:#6b7280;">إذا احتجت مساعدة، فريق ديار جاهز لخدمتك.</p>
HTML;
        }

        return <<<HTML
<p style="margin:0 0 16px;font-size:17px;line-height:1.7;">Welcome <strong>{$name}</strong>,</p>
<p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#4b5563;">We are glad you joined <strong>Diyar</strong>. Your journey starts here — we are with you every step of the way.</p>
<div style="margin:0 0 20px;padding:16px 18px;background:#faf7f2;border-radius:14px;border:1px solid #ece7e1;">
  <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">Phone</p>
  <p style="margin:0;font-size:15px;font-weight:700;color:#2f241f;direction:ltr;text-align:left;">{$phone}</p>
</div>
<p style="margin:0 0 12px;font-size:15px;font-weight:700;color:#2f241f;">What can you do now?</p>
<ul style="margin:0 0 16px;padding:0 0 0 20px;">{$rolesHtml}</ul>
<p style="margin:0;font-size:14px;line-height:1.7;color:#6b7280;">If you need help, the Diyar team is ready to assist you.</p>
HTML;
    }

    private function welcomeRoleLine(string $locale, RoleName $role): string
    {
        return match ($role) {
            RoleName::Customer => $locale === 'ar'
                ? '<strong>عميل:</strong> تصفّح المنتجات، أضف للسلة، واطلب بثقة.'
                : '<strong>Customer:</strong> Browse products, add to cart, and order with confidence.',
            RoleName::Vendor => $locale === 'ar'
                ? '<strong>تاجر:</strong> أدر متجرك، أضف منتجاتك، وتابع المبيعات والطلبات.'
                : '<strong>Vendor:</strong> Manage your store, list products, and track sales and orders.',
            RoleName::Provider => $locale === 'ar'
                ? '<strong>مزود خدمة:</strong> قدّم خدماتك، استقبل الطلبات، ونمِّ أعمالك.'
                : '<strong>Service provider:</strong> Offer your services, receive requests, and grow your business.',
            RoleName::Marketer => $locale === 'ar'
                ? '<strong>مسوّق:</strong> شارك العروض، تابع الحملات، وحقّق العمولات.'
                : '<strong>Marketer:</strong> Share offers, track campaigns, and earn commissions.',
            RoleName::Admin => $locale === 'ar'
                ? '<strong>مدير:</strong> أدر المنصة والعمليات.'
                : '<strong>Administrator:</strong> Manage the platform and operations.',
        };
    }

    /**
     * @param  list<array{label: string, value: string}>  $detailLines
     */
    public function notificationBody(
        string $locale,
        string $recipientName,
        string $title,
        string $body,
        ?string $actionUrl = null,
        array $detailLines = [],
    ): string {
        $greeting = $locale === 'ar'
            ? 'مرحباً '.e($recipientName).','
            : 'Hello '.e($recipientName).',';

        $detailsHtml = $this->detailLinesHtml($locale, $detailLines);

        $cta = '';
        if ($actionUrl !== null && $actionUrl !== '') {
            $label = $locale === 'ar' ? 'عرض التفاصيل' : 'View details';
            $cta = <<<HTML
<p style="margin:24px 0 0;text-align:center;">
  <a href="{$actionUrl}" style="display:inline-block;padding:12px 28px;background:#856b54;color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;font-size:14px;">{$label}</a>
</p>
HTML;
        }

        $direction = $locale === 'ar' ? 'rtl' : 'ltr';
        $textAlign = $locale === 'ar' ? 'right' : 'left';

        return <<<HTML
<div style="font-family:Segoe UI,Tahoma,Arial,sans-serif;color:#2f241f;direction:{$direction};text-align:{$textAlign};">
  <p style="margin:0 0 16px;font-size:16px;line-height:1.7;">{$greeting}</p>
  <div style="margin:0 0 20px;padding:18px 20px;background:#faf7f2;border:1px solid #ece7e1;border-radius:16px;">
    <p style="margin:0 0 8px;font-size:18px;font-weight:800;color:#2f241f;">{$title}</p>
    <p style="margin:0;font-size:15px;line-height:1.8;color:#4b5563;">{$body}</p>
  </div>
  {$detailsHtml}
  {$cta}
</div>
HTML;
    }

    /**
     * @param  list<array{label: string, value: string}>  $detailLines
     */
    private function detailLinesHtml(string $locale, array $detailLines): string
    {
        if ($detailLines === []) {
            return '';
        }

        $rows = '';
        foreach ($detailLines as $line) {
            if (! is_array($line) || ! isset($line['label'], $line['value'])) {
                continue;
            }

            $label = e($this->detailLabel($locale, (string) $line['label']));
            $value = e((string) $line['value']);
            $rows .= <<<HTML
<tr>
  <td style="padding:10px 0;font-size:13px;color:#6b7280;width:38%;vertical-align:top;">{$label}</td>
  <td style="padding:10px 0;font-size:14px;font-weight:700;color:#2f241f;vertical-align:top;">{$value}</td>
</tr>
HTML;
        }

        if ($rows === '') {
            return '';
        }

        $heading = $locale === 'ar' ? 'التفاصيل' : 'Details';

        return <<<HTML
<div style="margin:0 0 8px;padding:16px 18px;background:#ffffff;border:1px solid #ece7e1;border-radius:14px;">
  <p style="margin:0 0 12px;font-size:13px;font-weight:800;color:#856b54;letter-spacing:0.04em;text-transform:uppercase;">{$heading}</p>
  <table role="presentation" style="width:100%;border-collapse:collapse;">{$rows}</table>
</div>
HTML;
    }

    private function detailLabel(string $locale, string $key): string
    {
        $labels = [
            'ar' => [
                'order_number' => 'رقم الطلب',
                'total' => 'الإجمالي',
                'products' => 'المنتجات',
                'customer' => 'العميل',
                'store' => 'المتجر',
                'service' => 'الخدمة',
                'provider' => 'مزود الخدمة',
                'reference' => 'مرجع الحجز',
                'product' => 'المنتج',
                'rating' => 'التقييم',
                'reviewer' => 'المقيّم',
            ],
            'en' => [
                'order_number' => 'Order number',
                'total' => 'Total',
                'products' => 'Products',
                'customer' => 'Customer',
                'store' => 'Store',
                'service' => 'Service',
                'provider' => 'Provider',
                'reference' => 'Booking reference',
                'product' => 'Product',
                'rating' => 'Rating',
                'reviewer' => 'Reviewer',
            ],
        ];

        return $labels[$locale][$key] ?? $labels['en'][$key] ?? $key;
    }

    public function consultationInboundBody(
        string $locale,
        string $name,
        string $phone,
        ?string $email,
        string $message,
    ): string {
        $name = e($name);
        $phone = e($phone);
        $emailValue = e($email !== null && $email !== '' ? $email : '—');
        $messageHtml = nl2br(e($message));

        if ($locale === 'ar') {
            return <<<HTML
<div style="font-family:Segoe UI,Tahoma,Arial,sans-serif;color:#2f241f;direction:rtl;text-align:right;">
  <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#4b5563;">وصل طلب استشارة جديد عبر موقع ديار:</p>
  <table role="presentation" style="width:100%;border-collapse:collapse;background:#faf7f2;border:1px solid #ece7e1;border-radius:14px;overflow:hidden;">
    <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;width:32%;">الاسم</td><td style="padding:12px 16px;font-size:14px;font-weight:700;">{$name}</td></tr>
    <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;">الجوال</td><td style="padding:12px 16px;font-size:14px;font-weight:700;direction:ltr;text-align:right;">{$phone}</td></tr>
    <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;">البريد</td><td style="padding:12px 16px;font-size:14px;font-weight:700;">{$emailValue}</td></tr>
    <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;vertical-align:top;">التفاصيل</td><td style="padding:12px 16px;font-size:14px;line-height:1.8;">{$messageHtml}</td></tr>
  </table>
</div>
HTML;
        }

        return <<<HTML
<div style="font-family:Segoe UI,Tahoma,Arial,sans-serif;color:#2f241f;direction:ltr;text-align:left;">
  <p style="margin:0 0 16px;font-size:15px;line-height:1.8;color:#4b5563;">A new consultation request was submitted on Diyar:</p>
  <table role="presentation" style="width:100%;border-collapse:collapse;background:#faf7f2;border:1px solid #ece7e1;border-radius:14px;overflow:hidden;">
    <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;width:32%;">Name</td><td style="padding:12px 16px;font-size:14px;font-weight:700;">{$name}</td></tr>
    <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;">Phone</td><td style="padding:12px 16px;font-size:14px;font-weight:700;direction:ltr;">{$phone}</td></tr>
    <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;">Email</td><td style="padding:12px 16px;font-size:14px;font-weight:700;">{$emailValue}</td></tr>
    <tr><td style="padding:12px 16px;font-size:13px;color:#6b7280;vertical-align:top;">Details</td><td style="padding:12px 16px;font-size:14px;line-height:1.8;">{$messageHtml}</td></tr>
  </table>
</div>
HTML;
    }

    public function newsletterInboundBody(string $locale, string $email): string
    {
        $email = e($email);

        if ($locale === 'ar') {
            return <<<HTML
<div style="font-family:Segoe UI,Tahoma,Arial,sans-serif;color:#2f241f;direction:rtl;text-align:right;">
  <p style="margin:0 0 12px;font-size:15px;line-height:1.8;color:#4b5563;">اشتراك جديد في النشرة البريدية:</p>
  <p style="margin:0;font-size:16px;font-weight:700;color:#2f241f;direction:ltr;text-align:right;">{$email}</p>
</div>
HTML;
        }

        return <<<HTML
<div style="font-family:Segoe UI,Tahoma,Arial,sans-serif;color:#2f241f;direction:ltr;text-align:left;">
  <p style="margin:0 0 12px;font-size:15px;line-height:1.8;color:#4b5563;">New newsletter subscription:</p>
  <p style="margin:0;font-size:16px;font-weight:700;color:#2f241f;">{$email}</p>
</div>
HTML;
    }
}
