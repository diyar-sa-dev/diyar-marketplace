<?php

namespace App\Domains\Payments\Services\Gateways\MyFatoorah;

class DiyarMyFatoorahSessions extends DiyarMyFatoorah
{
    public function createSession(array $data)
    {
        $json = $this->callAPI($this->apiURL.'/v3/sessions', $data, null, 'CreateSession');

        return $json->Data;
    }
}
