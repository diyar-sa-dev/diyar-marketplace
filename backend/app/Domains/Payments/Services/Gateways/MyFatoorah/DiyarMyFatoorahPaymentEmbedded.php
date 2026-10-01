<?php

namespace App\Domains\Payments\Services\Gateways\MyFatoorah;

use MyFatoorah\Library\API\Payment\MyFatoorahPaymentEmbedded;

final class DiyarMyFatoorahPaymentEmbedded extends MyFatoorahPaymentEmbedded
{
    use DiyarMyFatoorahHttp;
}
