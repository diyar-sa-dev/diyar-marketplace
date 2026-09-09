<?php

namespace App\Support\Catalog\Filters;

enum FilterValueType: string
{
    case String = 'string';
    case Uuid = 'uuid';
    case Boolean = 'boolean';
    case Numeric = 'numeric';
    case Enum = 'enum';
    case StringList = 'string_list';
    case RangeMin = 'range_min';
    case RangeMax = 'range_max';
    case Integer = 'integer';
}
