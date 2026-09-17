<?php

namespace App\Http\Requests\Search;

use App\Support\VisualSearch\VisualSearchImageGuard;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;
use InvalidArgumentException;

class VisualSearchRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $maxKb = (int) config('diyar.visual_search.max_upload_kb', 2048);

        return [
            'image' => ['required', 'file', 'max:'.$maxKb, 'mimes:jpg,jpeg,png,webp'],
            'page' => ['sometimes', 'integer', 'min:1'],
            'per_page' => ['sometimes', 'integer', 'min:1'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $file = $this->file('image');
            if ($file === null || $validator->errors()->isNotEmpty()) {
                return;
            }

            try {
                VisualSearchImageGuard::assertSafeUpload($file);
            } catch (InvalidArgumentException $exception) {
                $validator->errors()->add('image', $exception->getMessage());
            }
        });
    }
}
