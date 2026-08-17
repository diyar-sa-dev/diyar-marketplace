<?php

namespace App\Services\Payments\Gateways\MyFatoorah;

use MyFatoorah\Library\API\Payment\MyFatoorahPaymentEmbedded;

final class DiyarMyFatoorahPaymentEmbedded extends MyFatoorahPaymentEmbedded
{
    use DiyarMyFatoorahHttp;
}
