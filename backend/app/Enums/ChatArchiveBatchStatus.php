<?php

namespace App\Enums;

enum ChatArchiveBatchStatus: string
{
    case Archiving = 'archiving';
    case Uploaded = 'uploaded';
    case Verified = 'verified';
    case SafeToPurge = 'safe_to_purge';
    case Failed = 'failed';
}
