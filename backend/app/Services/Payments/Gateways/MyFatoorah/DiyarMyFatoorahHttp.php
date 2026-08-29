<?php

namespace App\Services\Payments\Gateways\MyFatoorah;

use Exception;
use MyFatoorah\Library\MyFatoorah;

trait DiyarMyFatoorahHttp
{
    /**
     * @param  array<string, mixed>|null  $postFields
     *
     * @throws Exception
     */
    public function callAPI($url, $postFields = null, $orderId = null, $function = null)
    {
        $previousPrecision = ini_get('precision');
        $previousSerializePrecision = ini_get('serialize_precision');
        ini_set('precision', '14');
        ini_set('serialize_precision', '-1');

        try {
            return $this->diyarExecuteCurlRequest($url, $postFields, $orderId, $function);
        } finally {
            if ($previousPrecision !== false) {
                ini_set('precision', (string) $previousPrecision);
            }
            if ($previousSerializePrecision !== false) {
                ini_set('serialize_precision', (string) $previousSerializePrecision);
            }
        }
    }

    /**
     * @param  array<string, mixed>|null  $postFields
     *
     * @throws Exception
     */
    private function diyarExecuteCurlRequest($url, $postFields = null, $orderId = null, $function = null)
    {
        $request = isset($postFields) ? 'POST' : 'GET';
        $fields = empty($postFields)
            ? json_encode($postFields, JSON_FORCE_OBJECT)
            : json_encode($postFields, JSON_UNESCAPED_UNICODE);

        $msgLog = "Order #$orderId ----- $function";
        $this->log("$msgLog - Request: $fields");

        $curl = curl_init($url);

        $options = [
            CURLOPT_CUSTOMREQUEST => $request,
            CURLOPT_POSTFIELDS => $fields,
            CURLOPT_HTTPHEADER => ['Authorization: Bearer '.$this->config['apiKey'], 'Content-Type: application/json'],
            CURLOPT_RETURNTRANSFER => true,
        ];

        $options = $this->diyarApplyCurlSslOptions($options);

        curl_setopt_array($curl, $options);

        $res = curl_exec($curl);
        $err = curl_error($curl);

        curl_close($curl);

        if ($err) {
            $this->log("$msgLog - cURL Error: $err");
            throw new Exception('cURL Error: '.$err);
        }

        $this->log("$msgLog - Response: $res");

        $json = json_decode((string) $res);

        $error = MyFatoorah::getAPIError($json, (string) $res);
        if ($error) {
            $this->log("$msgLog - Error: $error");
            throw new Exception($error);
        }

        return $json;
    }

    /**
     * @param  array<int, mixed>  $options
     * @return array<int, mixed>
     */
    private function diyarApplyCurlSslOptions(array $options): array
    {
        if (! config('myfatoorah.ssl_verify', true)) {
            $options[CURLOPT_SSL_VERIFYPEER] = false;
            $options[CURLOPT_SSL_VERIFYHOST] = 0;

            return $options;
        }

        $caBundle = storage_path('cacert.pem');
        if (is_file($caBundle)) {
            $options[CURLOPT_CAINFO] = $caBundle;
        }

        return $options;
    }
}
