<?php

namespace App\Services\Payments\Gateways\MyFatoorah;

use App\Contracts\Payments\PaymentGatewayInterface;
use App\Services\Payments\DTO\PaymentCreationRequest;
use App\Services\Payments\DTO\PaymentCreationResult;
use App\Services\Payments\DTO\PaymentDetailsRequest;
use App\Services\Payments\DTO\PaymentDetailsResult;
use App\Services\Payments\DTO\PaymentMethodsRequest;
use App\Services\Payments\DTO\PaymentSessionRequest;
use App\Services\Payments\DTO\PaymentSessionResult;
use App\Services\Payments\DTO\RefundPaymentRequest;
use App\Services\Payments\DTO\RefundPaymentResult;
use App\Services\Payments\Exceptions\PaymentGatewayException;
use Exception;
use MyFatoorah\Library\MyFatoorah;

final class MyFatoorahGateway implements PaymentGatewayInterface
{
    public function __construct(
        private readonly MyFatoorahPaymentMapper $paymentMapper,
        private readonly MyFatoorahPaymentResponseMapper $responseMapper,
        private readonly MyFatoorahPaymentMethodMapper $methodMapper,
    ) {}

    public function name(): string
    {
        return 'myfatoorah';
    }

    public function listPaymentMethods(PaymentMethodsRequest $request): array
    {
        MyFatoorahConfigFactory::assertConfigured();

        try {
            $embedded = new DiyarMyFatoorahPaymentEmbedded(MyFatoorahConfigFactory::libraryConfig());
            $gateways = $embedded->getCheckoutGateways(
                (float) $request->amount,
                $request->currency,
                $request->applePayEnabled,
            );

            return $this->methodMapper->mapCheckoutGateways($gateways);
        } catch (Exception) {
            throw PaymentGatewayException::operationFailed(__('diyar.payment.methods_unavailable'));
        }
    }

    public function createSession(PaymentSessionRequest $request): PaymentSessionResult
    {
        MyFatoorahConfigFactory::assertConfigured();

        try {
            MyFatoorahConfigFactory::assertHttpsRedirect($request->callbackUrl);
            $sessions = new DiyarMyFatoorahSessions(MyFatoorahConfigFactory::libraryConfig());
            $payload = $this->paymentMapper->mapSessionRequest($request);
            $data = $sessions->createSession($payload);

            $config = MyFatoorahConfigFactory::libraryConfig();
            $countries = MyFatoorah::getMFCountries();
            $countryCode = strtoupper($config['countryCode']);
            $scriptDomain = $config['isTest']
                ? $countries[$countryCode]['testPortal']
                : $countries[$countryCode]['portal'];

            return new PaymentSessionResult(
                sessionId: (string) $data->SessionId,
                countryCode: $countryCode,
                testMode: (bool) $config['isTest'],
                scriptDomain: (string) $scriptDomain,
            );
        } catch (Exception $exception) {
            report($exception);

            $message = app()->isLocal()
                ? __('diyar.payment.session_failed').' ('.$exception->getMessage().')'
                : __('diyar.payment.session_failed');

            throw PaymentGatewayException::operationFailed($message);
        }
    }

    public function createPayment(PaymentCreationRequest $request): PaymentCreationResult
    {
        MyFatoorahConfigFactory::assertConfigured();

        try {
            MyFatoorahConfigFactory::assertHttpsRedirect($request->callbackUrl);
            $payments = new DiyarMyFatoorahPayments(MyFatoorahConfigFactory::libraryConfig());
            $payload = $this->paymentMapper->mapPaymentRequest($request);
            $data = $payments->createPayment($payload);

            return new PaymentCreationResult(
                paymentUrl: (string) ($data->PaymentURL ?? $data->InvoiceURL ?? ''),
                gatewayPaymentId: isset($data->PaymentId) ? (string) $data->PaymentId : null,
                gatewayInvoiceId: isset($data->InvoiceId) ? (string) $data->InvoiceId : null,
            );
        } catch (Exception) {
            throw PaymentGatewayException::operationFailed(__('diyar.payment.creation_failed'));
        }
    }

    public function getPaymentDetails(PaymentDetailsRequest $request): PaymentDetailsResult
    {
        MyFatoorahConfigFactory::assertConfigured();

        try {
            $payments = new DiyarMyFatoorahPayments(MyFatoorahConfigFactory::libraryConfig());
            $data = $payments->getPaymentDetails($request->gatewayPaymentId);

            return $this->responseMapper->mapPaymentDetails(
                $data,
                $request->expectedReference,
                $request->expectedAmount,
                $request->expectedCurrency,
            );
        } catch (PaymentGatewayException $exception) {
            throw $exception;
        } catch (Exception) {
            throw PaymentGatewayException::operationFailed(__('diyar.payment.verification_failed'));
        }
    }

    public function refund(RefundPaymentRequest $request): RefundPaymentResult
    {
        MyFatoorahConfigFactory::assertConfigured();

        throw PaymentGatewayException::operationFailed(__('diyar.payment.refund_not_implemented'));
    }
}
