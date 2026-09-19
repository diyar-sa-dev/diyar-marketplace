<?php

namespace App\Http\Requests\RoomDesign;

use Illuminate\Foundation\Http\FormRequest;

class AddRoomDesignToCartRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'item_ids' => ['sometimes', 'array', 'max:100'],
            'item_ids.*' => ['string', 'uuid'],
        ];
    }

    /**
     * @return list<string>|null
     */
    public function roomItemIds(): ?array
    {
        if (! $this->has('item_ids')) {
            return null;
        }

        /** @var list<string> $ids */
        $ids = $this->input('item_ids', []);

        return $ids;
    }
}
