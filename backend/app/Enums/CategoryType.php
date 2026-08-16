<?php

namespace App\Enums;

enum CategoryType: string
{
    case Product = 'product';
    case Service = 'service';
    case Both = 'both';
}
