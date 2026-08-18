<?php

namespace App\Http\Requests\StoreReview;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class StoreStoreReviewRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    protected function prepareForValidation(): void
    {
        //
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'order_id' => ['required', 'uuid', 'exists:orders,id'],
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string', 'max:2000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            if (! $this->has('comment')) {
                return;
            }

            $raw = $this->input('comment');
            if ($raw === null || trim(strip_tags((string) $raw)) === '') {
                $validator->errors()->add('comment', __('diyar.store_review.comment_empty'));
            }
        });
    }
}
