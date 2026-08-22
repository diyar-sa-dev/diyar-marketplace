<?php

namespace App\Enums;

enum SystemSettingGroup: string
{
    case Affiliate = 'affiliate';
    case Commerce = 'commerce';
    case Orders = 'orders';
    case Shipping = 'shipping';
    case Payouts = 'payouts';
    case Services = 'services';
    case Notifications = 'notifications';
    case Feature = 'feature';
    case Theme = 'theme';

    /** @return list<self> */
    public static function all(): array
    {
        return self::cases();
    }

    public function labelKey(): string
    {
        return 'admin.settings.groups.'.$this->value;
    }
}
