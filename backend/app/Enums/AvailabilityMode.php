<?php

namespace App\Enums;

enum AvailabilityMode: string
{
    case InStock = 'in_stock';
    case OutOfStock = 'out_of_stock';
    case Preorder = 'preorder';
}
