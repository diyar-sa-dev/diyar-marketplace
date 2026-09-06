<?php

namespace App\Enums;

enum PaymentStatus: string
{
    case Pending = 'pending';
    case Processing = 'processing';
    case RequiresAction = 'requires_action';
    case Authorized = 'authorized';
    case Paid = 'paid';
    case Failed = 'failed';
    case Cancelled = 'cancelled';
    case Expired = 'expired';
    case Unknown = 'unknown';
    case Refunding = 'refunding';
    case PartiallyRefunded = 'partially_refunded';
    case Refunded = 'refunded';

    /**
     * @return list<self>
     */
    public function terminalStatuses(): array
    {
        return [self::Paid, self::Failed, self::Cancelled, self::Refunded];
    }

    public function isTerminal(): bool
    {
        return in_array($this, $this->terminalStatuses(), true);
    }
}
