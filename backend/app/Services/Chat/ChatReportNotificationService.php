<?php

namespace App\Services\Chat;

use App\Enums\ChatMessageReportStatus;
use App\Enums\NotificationType;
use App\Models\ChatMessageReport;
use App\Models\User;
use App\Support\Notifications\NotificationUrlSupport;
use App\Services\Notifications\NotificationDispatcher;
use App\Support\User\UserNotificationPreferences;

final class ChatReportNotificationService
{
    public function __construct(
        private readonly NotificationDispatcher $dispatcher,
    ) {}

    public function notifyReportResolved(ChatMessageReport $report): void
    {
        $report->loadMissing(['reporter', 'message.sender']);

        $this->notifyReporter($report);

        if ($report->status === ChatMessageReportStatus::Actioned) {
            $this->notifyReportedSender($report);
        }
    }

    private function notifyReporter(ChatMessageReport $report): void
    {
        $reporter = $report->reporter;
        if (! $reporter instanceof User) {
            return;
        }

        $resolutionNote = trim((string) ($report->resolution_note ?? ''));
        $titleKey = $report->status === ChatMessageReportStatus::UnderReview
            ? 'diyar.notifications.chat_report_resolved.title_under_review'
            : 'diyar.notifications.chat_report_resolved.title';

        $this->dispatcher->dispatch(
            type: NotificationType::ChatReportResolved,
            recipients: [$reporter],
            payload: [
                'title' => $this->translate($reporter, $titleKey),
                'reason' => (string) $report->reason,
                'reason_label' => $this->reasonLabel($reporter, (string) $report->reason),
                'status' => $report->status->value,
                'status_label' => $this->statusLabel($reporter, $report->status),
                'resolution_note' => $resolutionNote,
                'note_line' => $resolutionNote !== ''
                    ? $this->translate($reporter, 'diyar.notifications.chat_report_resolved.note_line', [
                        'resolution_note' => $resolutionNote,
                    ])
                    : '',
                'conversation_id' => $report->conversation_id,
                'action_url' => NotificationUrlSupport::chatConversationUrl((string) $report->conversation_id),
            ],
            entityType: 'chat_message_report',
            entityId: $report->id,
            dedupeKey: "chat.report.resolved:{$report->id}:reporter",
        );
    }

    private function notifyReportedSender(ChatMessageReport $report): void
    {
        $actionTaken = (string) ($report->action_taken ?? '');
        if (! in_array($actionTaken, ['delete_message', 'warn_sender', 'suspend_account', 'escalate'], true)) {
            return;
        }

        $sender = $report->message?->sender;
        if (! $sender instanceof User || $sender->id === $report->reporter_id) {
            return;
        }

        $resolutionNote = trim((string) ($report->resolution_note ?? ''));

        $this->dispatcher->dispatch(
            type: NotificationType::ChatModerationActionTaken,
            recipients: [$sender],
            payload: [
                'action_taken' => $actionTaken,
                'action_label' => $this->actionLabel($sender, $actionTaken),
                'resolution_note' => $resolutionNote,
                'note_line' => $resolutionNote !== ''
                    ? $this->translate($sender, 'diyar.notifications.chat_moderation_action_taken.note_line', [
                        'resolution_note' => $resolutionNote,
                    ])
                    : '',
                'conversation_id' => $report->conversation_id,
                'action_url' => NotificationUrlSupport::chatConversationUrl((string) $report->conversation_id),
            ],
            entityType: 'chat_message_report',
            entityId: $report->id,
            dedupeKey: "chat.report.moderation:{$report->id}:sender",
        );
    }

    private function reasonLabel(User $user, string $reason): string
    {
        $key = 'diyar.notifications.chat_report_reasons.'.strtolower($reason);
        $label = $this->translate($user, $key);

        return $label !== $key ? $label : str_replace('_', ' ', $reason);
    }

    private function statusLabel(User $user, ChatMessageReportStatus $status): string
    {
        $key = 'diyar.notifications.chat_report_resolved.status.'.$status->value;

        return $this->translate($user, $key);
    }

    private function actionLabel(User $user, string $actionTaken): string
    {
        $normalized = match ($actionTaken) {
            'escalate' => 'suspend_account',
            default => $actionTaken,
        };

        $key = 'diyar.notifications.chat_moderation_action_taken.actions.'.$normalized;

        return $this->translate($user, $key);
    }

    /**
     * @param  array<string, scalar|null>  $replace
     */
    private function translate(User $user, string $key, array $replace = []): string
    {
        $locale = UserNotificationPreferences::mailLocale($user);
        $previous = app()->getLocale();
        app()->setLocale($locale);

        try {
            return (string) __($key, $replace);
        } finally {
            app()->setLocale($previous);
        }
    }
}
