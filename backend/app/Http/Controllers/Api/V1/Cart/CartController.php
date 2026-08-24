<?php

namespace App\Http\Controllers\Api\V1\Cart;

use App\Http\Controllers\Controller;
use App\Http\Requests\Cart\StoreCartItemRequest;
use App\Http\Requests\Cart\UpdateCartItemRequest;
use App\Http\Resources\CartResource;
use App\Models\Cart;
use App\Services\Cart\CartMergeService;
use App\Services\Cart\CartService;
use App\Services\Cart\CartValidationService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CartController extends Controller
{
    public function __construct(
        private readonly CartService $carts,
        private readonly CartMergeService $merge,
        private readonly CartValidationService $validation,
    ) {}

    public function show(Request $request): JsonResponse
    {
        $cart = $this->resolveCart($request);

        return ApiResponse::success(data: [
            'cart' => new CartResource($this->carts->loadCart($cart, $request->user())),
        ]);
    }

    public function clear(Request $request): JsonResponse
    {
        $cart = $this->resolveCart($request);
        $cleared = $this->carts->clear($cart);

        return ApiResponse::success(
            data: ['cart' => new CartResource($cleared)],
            message: __('diyar.cart.cleared'),
        );
    }

    public function storeItem(StoreCartItemRequest $request): JsonResponse
    {
        $cart = $this->resolveCart($request);
        $updated = $this->carts->addItem(
            $cart,
            $request->validated('product_id'),
            (int) $request->validated('quantity'),
            $request->validated('color_name'),
            $request->validated('color_hex'),
        );

        return ApiResponse::success(data: [
            'cart' => new CartResource($updated),
        ]);
    }

    public function updateItem(UpdateCartItemRequest $request, string $item): JsonResponse
    {
        $cart = $this->resolveCart($request);
        $cartItem = $this->carts->findItemForCart($cart, $item);
        $updated = $this->carts->updateItemQuantity(
            $cart,
            $cartItem,
            (int) $request->validated('quantity'),
        );

        return ApiResponse::success(data: [
            'cart' => new CartResource($updated),
        ]);
    }

    public function destroyItem(Request $request, string $item): JsonResponse
    {
        $cart = $this->resolveCart($request);
        $cartItem = $this->carts->findItemForCart($cart, $item);
        $updated = $this->carts->removeItem($cart, $cartItem);

        return ApiResponse::success(data: [
            'cart' => new CartResource($updated),
        ]);
    }

    public function merge(Request $request): JsonResponse
    {
        $user = $request->user();
        $sessionId = (string) $request->session()->getId();

        $result = $this->merge->mergeGuestIntoUser($user, $sessionId);

        return ApiResponse::success(data: [
            'cart' => new CartResource($result['cart']),
            'warnings' => $result['warnings'],
        ]);
    }

    public function validateCart(Request $request): JsonResponse
    {
        $cart = $this->resolveCart($request);
        $result = $this->validation->validate($cart);

        return ApiResponse::success(data: [
            'cart' => new CartResource($this->carts->loadCart($cart, $request->user())),
            'validation' => $result,
        ]);
    }

    private function resolveCart(Request $request): Cart
    {
        if ($request->user() !== null) {
            return $this->carts->resolveForUser($request->user());
        }

        return $this->carts->resolveForGuest((string) $request->session()->getId());
    }
}
