<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin array{value: string, label: string} */
class ChatReportReasonResource extends JsonResource
{
    /**
     * @return array{value: string, label: string}
     */
    public function toArray(Request $request): array
    {
        return [
            'value' => (string) ($this->resource['value'] ?? ''),
            'label' => (string) ($this->resource['label'] ?? ''),
        ];
    }
}
