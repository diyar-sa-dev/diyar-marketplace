<?php

namespace App\Enums;

enum NotificationBroadcastAudience: string
{
    case All = 'all';
    case Role = 'role';
    case Customer = 'customer';
    case Vendor = 'vendor';
    case Provider = 'provider';
    case SelectedUsers = 'selected_users';
}
