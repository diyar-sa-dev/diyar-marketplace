<?php

namespace App\Enums;

enum ConversationType: string
{
    case CustomerVendor = 'customer_vendor';
    case CustomerProvider = 'customer_provider';
    case CustomerAdmin = 'customer_admin';
}
