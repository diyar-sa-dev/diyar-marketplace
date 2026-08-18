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
}
