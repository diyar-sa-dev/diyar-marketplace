<?php

namespace App\Http\Controllers\Api\V1\Profile;

use App\Http\Controllers\Controller;
use App\Http\Requests\Profile\StoreAddressRequest;
use App\Http\Requests\Profile\UpdateAddressRequest;
use App\Http\Resources\AddressResource;
use App\Services\Profile\AddressService;
use App\Support\Api\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    public function __construct(
        private readonly AddressService $addresses,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $items = $request->user()
            ->addresses()
            ->orderByDesc('is_default')
            ->orderByDesc('updated_at')
            ->get();

        return ApiResponse::success(data: [
            'addresses' => AddressResource::collection($items),
        ]);
    }

    public function store(StoreAddressRequest $request): JsonResponse
    {
        $address = $this->addresses->create(
            user: $request->user(),
            attributes: $request->validated(),
        );

        return ApiResponse::success(
            data: ['address' => new AddressResource($address)],
            message: __('diyar.profile.address_created'),
            status: 201,
        );
    }

    public function show(Request $request, string $address): JsonResponse
    {
        $model = $this->addresses->findOwnedAddress($request->user(), $address);

        return ApiResponse::success(data: [
            'address' => new AddressResource($model),
        ]);
    }

    public function update(UpdateAddressRequest $request, string $address): JsonResponse
    {
        $model = $this->addresses->findOwnedAddress($request->user(), $address);
        $updated = $this->addresses->update(
            user: $request->user(),
            address: $model,
            attributes: $request->validated(),
        );

        return ApiResponse::success(
            data: ['address' => new AddressResource($updated)],
            message: __('diyar.profile.address_updated'),
        );
    }

    public function destroy(Request $request, string $address): JsonResponse
    {
        $model = $this->addresses->findOwnedAddress($request->user(), $address);
        $this->addresses->delete($request->user(), $model);

        return ApiResponse::success(message: __('diyar.profile.address_deleted'));
    }

    public function setDefault(Request $request, string $address): JsonResponse
    {
        $model = $this->addresses->findOwnedAddress($request->user(), $address);
        $updated = $this->addresses->setDefault($request->user(), $model);

        return ApiResponse::success(
            data: ['address' => new AddressResource($updated)],
            message: __('diyar.profile.address_default_set'),
        );
    }
}
