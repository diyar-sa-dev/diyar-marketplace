<?php

namespace App\Domains\Payments\Controllers;

use App\Http\Controllers\Controller;
use App\Domains\Payments\Requests\InitiatePaymentRequest;
use App\Domains\Payments\Requests\SimulatePaymentRequest;
use App\Domains\Payments\Requests\SubmitPaymentRequest;
use App\Domains\Payments\Resources\PaymentInitiationResource;
use App\Domains\Payments\Resources\PaymentResource;
use App\Domains\Payments\Resources\PaymentSubmissionResource;
use App\Models\Order;
use App\Domains\Payments\Exceptions\PaymentGatewayException;
use App\Domains\Payments\Services\PaymentOrchestrator;
use App\Core\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\ConflictHttpException;
use Symfony\Component\HttpKernel\Exception\UnprocessableEntityHttpException;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentOrchestrator $payments,
    ) {}

    public function show(Request $request, Order $order): JsonResponse
    {
        $this->authorize('view', $order);

        $payment = $this->payments->show($order, $request->user());

        return ApiResponse::success(new PaymentResource($payment));
    }

    public function initiate(InitiatePaymentRequest $request, Order $order): JsonResponse
    {
        $this->authorize('pay', $order);

        try {
            $result = $this->payments->initiate(
                $order,
                $request->user(),
                $request->validated('idempotency_key'),
            );
        } catch (PaymentGatewayException $exception) {
            return ApiResponse::error($exception->getMessage(), 502);
        } catch (UnprocessableEntityHttpException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (ConflictHttpException $exception) {
            return ApiResponse::error($exception->getMessage(), 409);
        }

        return ApiResponse::success(new PaymentInitiationResource($result));
    }

    public function submit(SubmitPaymentRequest $request, Order $order): JsonResponse
    {
        $this->authorize('pay', $order);

        try {
            $result = $this->payments->submit(
                $order,
                $request->user(),
                $request->validated('session_id'),
                $request->validated('idempotency_key'),
                $request->validated('payment_method'),
            );
        } catch (PaymentGatewayException $exception) {
            return ApiResponse::error($exception->getMessage(), 502);
        } catch (UnprocessableEntityHttpException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (ConflictHttpException $exception) {
            return ApiResponse::error($exception->getMessage(), 409);
        }

        return ApiResponse::success(new PaymentSubmissionResource($result));
    }

    public function callback(Request $request, Order $order): JsonResponse
    {
        $this->authorize('view', $order);

        $result = $this->payments->browserCallback(
            $order,
            $request->user(),
            $request->query('paymentId'),
        );

        return ApiResponse::success($result);
    }

    public function simulate(SimulatePaymentRequest $request, Order $order): JsonResponse
    {
        $this->authorize('pay', $order);

        try {
            $result = $this->payments->simulateLocalOutcome(
                $order,
                $request->user(),
                $request->validated('attempt_id'),
                $request->validated('outcome'),
            );
        } catch (UnprocessableEntityHttpException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        } catch (ConflictHttpException $exception) {
            return ApiResponse::error($exception->getMessage(), 409);
        } catch (InvalidArgumentException $exception) {
            return ApiResponse::error($exception->getMessage(), 422);
        }

        return ApiResponse::success($result);
    }
}
