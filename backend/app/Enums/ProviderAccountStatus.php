<?php

namespace App\Enums;

enum ProviderAccountStatus: string
{
    case Active = 'active';
    case Suspended = 'suspended';
}
