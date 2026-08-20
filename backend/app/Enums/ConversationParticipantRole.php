<?php

namespace App\Enums;

enum ConversationParticipantRole: string
{
    case Customer = 'customer';
    case Vendor = 'vendor';
    case Provider = 'provider';
    case Admin = 'admin';
}
