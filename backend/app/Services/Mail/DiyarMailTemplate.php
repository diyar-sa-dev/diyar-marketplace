<?php

namespace App\Services\Mail;

final class DiyarMailTemplate
{
    public const LOGO_CID = 'diyar-logo';

    /**
     * @param  array<string, string>  $props
     */
    public function render(string $locale, string $title, string $bodyHtml, array $props = []): string
    {
        $dir = $locale === 'ar' ? 'rtl' : 'ltr';
        $align = $locale === 'ar' ? 'right' : 'left';
        $brand = $locale === 'ar'
            ? (config('diyar.mail.brand_name_ar', 'ديار'))
            : config('diyar.mail.brand_name', 'Diyar');
        $ctaLabel = $props['cta_label'] ?? '';
        $ctaUrl = $props['cta_url'] ?? '';
        $footer = $props['footer'] ?? ($locale === 'ar'
            ? '© '.date('Y')." {$brand}. جميع الحقوق محفوظة."
            : '© '.date('Y')." {$brand}. All rights reserved.");

        $useEmbeddedLogo = ($props['embed_logo'] ?? 'true') !== 'false';
        $logoBlock = $useEmbeddedLogo
            ? '<img src="cid:'.self::LOGO_CID.'" alt="'.e($brand).'" width="140" height="48" style="display:block;margin:0 auto 12px;max-height:48px;width:auto;">'
            : '';

        $ctaBlock = ($ctaLabel !== '' && $ctaUrl !== '')
            ? '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:28px;">
                <tr>
                  <td align="center">
                    <a href="'.e($ctaUrl).'" style="display:inline-block;background:linear-gradient(135deg,#856b54 0%,#6d5844 100%);color:#fff;text-decoration:none;font-weight:700;padding:14px 32px;border-radius:14px;box-shadow:0 8px 20px rgba(133,107,84,0.35);">'
                .e($ctaLabel).'</a>
                  </td>
                </tr>
                <tr>
                  <td align="center" style="padding-top:16px;font-size:12px;line-height:1.7;color:#6b7280;">
                    '.($locale === 'ar'
                ? 'إذا لم يعمل الزر، انسخ الرابط التالي والصقه في المتصفح:'
                : 'If the button does not work, copy and paste this link into your browser:').'<br>
                    <a href="'.e($ctaUrl).'" style="color:#856b54;word-break:break-all;">'.e($ctaUrl).'</a>
                  </td>
                </tr>
              </table>'
            : '';

        return <<<HTML
<!DOCTYPE html>
<html lang="{$locale}" dir="{$dir}">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>{$title}</title>
</head>
<body style="margin:0;padding:24px;background:#f5f3ef;font-family:Tahoma,'Segoe UI',Arial,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:640px;margin:0 auto;">
    <tr>
      <td style="background:linear-gradient(135deg,#2f241f 0%,#4a382f 100%);border-radius:20px 20px 0 0;padding:28px;text-align:center;">
        {$logoBlock}
        <div style="font-size:22px;font-weight:800;color:#fff;">{$brand}</div>
        <div style="font-size:14px;color:#f5e6d3;margin-top:8px;line-height:1.6;">{$title}</div>
      </td>
    </tr>
    <tr>
      <td style="background:#ffffff;padding:32px 28px;border-left:1px solid #ece7e1;border-right:1px solid #ece7e1;text-align:{$align};">
        {$bodyHtml}
        {$ctaBlock}
      </td>
    </tr>
    <tr>
      <td style="background:#faf7f2;border-radius:0 0 20px 20px;padding:18px 28px;text-align:center;font-size:12px;color:#6b7280;border:1px solid #ece7e1;border-top:none;line-height:1.6;">
        {$footer}
      </td>
    </tr>
  </table>
</body>
</html>
HTML;
    }

    public function logoPath(): ?string
    {
        $png = resource_path('mail/logo_diyar.png');
        if (is_file($png)) {
            return $png;
        }

        $svg = resource_path('mail/logo_diyar.svg');

        return is_file($svg) ? $svg : null;
    }
}
