<?php

namespace App\Enums;

enum B2bLeadBudgetRange: string
{
    case Unspecified = 'unspecified';
    case Under10k = 'under_10k';
    case From10kTo50k = '10k_50k';
    case From50kTo200k = '50k_200k';
    case Over200k = 'over_200k';
}
