<?php

namespace App\Http\Requests\Dashboard\Concerns;

use App\Services\Identity\PhoneNormalizer;

trait PreparesPartnerB2bCompanyInput
{
    protected function prepareForValidation(): void
    {
        $payload = [];

        if ($this->has('phone')) {
            $phone = trim((string) ($this->input('phone') ?? ''));
            if ($phone === '') {
                $payload['phone'] = null;
            } else {
                $payload['phone'] = PhoneNormalizer::normalize($phone) ?? $phone;
            }
        }

        if ($this->has('website')) {
            $website = trim((string) ($this->input('website') ?? ''));
            if ($website === '') {
                $payload['website'] = null;
            } elseif (! preg_match('/^https?:\/\//i', $website)) {
                $payload['website'] = 'https://'.$website;
            }
        }

        if ($this->filled('custom_category')) {
            $payload['custom_category'] = trim((string) $this->input('custom_category'));
            $payload['b2b_category_id'] = null;
        } elseif ($this->filled('b2b_category_id')) {
            $payload['custom_category'] = null;
        }

        if ($payload !== []) {
            $this->merge($payload);
        }
    }
}
