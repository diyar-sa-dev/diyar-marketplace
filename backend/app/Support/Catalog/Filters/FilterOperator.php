<?php

namespace App\Support\Catalog\Filters;

enum FilterOperator: string
{
    case Eq = 'eq';
    case Gte = 'gte';
    case Lte = 'lte';
    case In = 'in';
    case Like = 'like';
}
