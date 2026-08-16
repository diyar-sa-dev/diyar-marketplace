<?php

namespace App\Http\Requests\Dashboard;

use App\Enums\InventoryMovementType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class AdjustInventoryRequest extends FormRequest
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
            'type' => [
                'required',
                'string',
                Rule::in([
                    InventoryMovementType::Increase->value,
                    InventoryMovementType::Decrease->value,
                    InventoryMovementType::Adjustment->value,
                ]),
            ],
            'quantity' => [
                'required',
                'integer',
                Rule::when(
                    fn () => $this->input('type') === InventoryMovementType::Adjustment->value,
                    ['min:0'],
                    ['min:1'],
                ),
            ],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }
}
