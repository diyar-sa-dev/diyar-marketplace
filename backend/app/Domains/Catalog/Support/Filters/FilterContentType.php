<?php

namespace App\Domains\Catalog\Support\Filters;

enum FilterContentType: string
{
    case Shared = 'shared';
    case Product = 'product';
    case Service = 'service';
}
