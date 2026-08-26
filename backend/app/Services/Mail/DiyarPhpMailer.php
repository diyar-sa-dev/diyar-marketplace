<?php

namespace App\Services\Mail;

use Illuminate\Support\Facades\Log;
use PHPMailer\PHPMailer\Exception as MailerException;
use PHPMailer\PHPMailer\PHPMailer;

final class DiyarPhpMailer
{
    public function __construct(
        private readonly DiyarMailTemplate $templates,
    ) {}

    /**
     * @param  array<string, string>  $templateProps
     */
    public function send(
        string $toEmail,
        string $subject,
        string $locale,
        string $title,
        string $bodyHtml,
        array $templateProps = [],
        bool $strict = false,
    ): void {
        $html = $this->templates->render($locale, $title, $bodyHtml, $templateProps);

        if (! config('diyar.mail.enabled', false)) {
            if ($strict) {
                throw new \RuntimeException('Mail delivery is disabled. Set DIYAR_MAIL_ENABLED=true.');
            }

            Log::info('diyar.mail.skipped', [
                'to' => $toEmail,
                'subject' => $subject,
                'reason' => 'disabled',
            ]);

            return;
        }

        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->Host = (string) config('diyar.mail.host');
            $mail->SMTPAuth = true;
            $mail->Username = (string) config('diyar.mail.username');
            $mail->Password = (string) config('diyar.mail.password');
            $encryption = (string) config('diyar.mail.encryption', 'tls');
            if ($encryption !== '' && $encryption !== 'false') {
                $mail->SMTPSecure = $encryption === 'ssl'
                    ? PHPMailer::ENCRYPTION_SMTPS
                    : PHPMailer::ENCRYPTION_STARTTLS;
            }
            $mail->Port = (int) config('diyar.mail.port', 587);
            $mail->CharSet = PHPMailer::CHARSET_UTF8;

            $fromAddress = (string) config('diyar.mail.from_address', 'noreply@diyar.sa');
            $fromName = (string) config('diyar.mail.from_name', 'Diyar');
            $username = (string) config('diyar.mail.username');
            if ($username !== '' && ! str_contains($fromAddress, '@')) {
                $fromAddress = $username;
            }

            $mail->setFrom($fromAddress, $fromName);
            $mail->addAddress($toEmail);
            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $html;
            $mail->AltBody = strip_tags(str_replace(['<br>', '<br/>', '<br />'], "\n", $bodyHtml));

            $this->embedLogo($mail);

            $mail->send();
        } catch (MailerException $exception) {
            Log::error('diyar.mail.failed', [
                'to' => $toEmail,
                'subject' => $subject,
                'error' => $exception->getMessage(),
            ]);

            if ($strict || ! config('diyar.mail.fail_silently', true)) {
                throw $exception;
            }
        }
    }

    private function embedLogo(PHPMailer $mail): void
    {
        $logoPath = $this->templates->logoPath();

        if ($logoPath === null) {
            return;
        }

        $extension = strtolower(pathinfo($logoPath, PATHINFO_EXTENSION));
        $mime = match ($extension) {
            'png' => 'image/png',
            'jpg', 'jpeg' => 'image/jpeg',
            'gif' => 'image/gif',
            default => 'image/svg+xml',
        };

        $mail->addEmbeddedImage(
            $logoPath,
            DiyarMailTemplate::LOGO_CID,
            'diyar-logo.'.$extension,
            PHPMailer::ENCODING_BASE64,
            $mime,
        );
    }
}
