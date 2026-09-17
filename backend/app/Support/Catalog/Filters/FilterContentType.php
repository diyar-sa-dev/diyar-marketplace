<?php

namespace App\Support\Catalog\Filters;

enum FilterContentType: string
{
    case Shared = 'shared';
    case Product = 'product';
    case Service = 'service';
}
