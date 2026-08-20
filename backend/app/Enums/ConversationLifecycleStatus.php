<?php

namespace App\Enums;

enum ConversationLifecycleStatus: string
{
    case Active = 'active';
    case Inactive = 'inactive';
    case Archivable = 'archivable';
    case Archived = 'archived';
    case Closed = 'closed';
    case Blocked = 'blocked';
}
