<?php

namespace App\Services\Payments\Gateways\MyFatoorah;

class DiyarMyFatoorahPayments extends DiyarMyFatoorah
{
    public function createPayment(array $data)
    {
        $reference = $data['Order']['ExternalIdentifier'] ?? null;
        $json = $this->callAPI($this->apiURL.'/v3/payments', $data, $reference, 'CreatePayment');

        return $json->Data;
    }

    public function getPaymentDetails($paymentId)
    {
        $json = $this->callAPI($this->apiURL.'/v3/payments/'.$paymentId, null, $paymentId, 'getPaymentDetails');

        return $json->Data;
    }
}
