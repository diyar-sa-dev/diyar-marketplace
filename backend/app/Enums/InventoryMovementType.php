<?php

namespace App\Enums;

enum InventoryMovementType: string
{
    case Increase = 'increase';
    case Decrease = 'decrease';
    case Adjustment = 'adjustment';
    case Sale = 'sale';
    case Return = 'return';
    case Reservation = 'reservation';
    case Release = 'release';
}
