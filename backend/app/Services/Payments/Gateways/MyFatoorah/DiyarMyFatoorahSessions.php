<?php

namespace App\Services\Payments\Gateways\MyFatoorah;

class DiyarMyFatoorahSessions extends DiyarMyFatoorah
{
    public function createSession(array $data)
    {
        $json = $this->callAPI($this->apiURL.'/v3/sessions', $data, null, 'CreateSession');

        return $json->Data;
    }
}
