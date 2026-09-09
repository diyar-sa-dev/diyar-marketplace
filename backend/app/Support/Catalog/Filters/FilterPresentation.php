<?php

namespace App\Support\Catalog\Filters;

enum FilterPresentation: string
{
    case Text = 'text';
    case Select = 'select';
    case MultiSelect = 'multi_select';
    case Range = 'range';
    case Boolean = 'boolean';
    case Minimum = 'minimum';
    case Hidden = 'hidden';
}
