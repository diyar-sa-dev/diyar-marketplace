<?php

namespace App\Enums;

enum CartStatus: string
{
    case Active = 'active';
    case Merged = 'merged';
    case Abandoned = 'abandoned';
    case Converted = 'converted';
}
