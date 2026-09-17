<?php

namespace App\Http\Requests\Catalog\Concerns;

trait PreparesCatalogFilterQuery
{
    protected function prepareForValidation(): void
    {
        $merged = [];

        foreach (['discounted', 'remote'] as $booleanKey) {
            if (! $this->has($booleanKey)) {
                continue;
            }

            $parsed = filter_var($this->input($booleanKey), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

            if ($parsed !== null) {
                $merged[$booleanKey] = $parsed;
            }
        }

        if ($this->filled('max_price') && ! $this->filled('min_price')) {
            $merged['min_price'] = 0;
        }

        if ($this->filled('min_price') && $this->filled('max_price')) {
            $min = (float) $this->input('min_price');
            $max = (float) $this->input('max_price');

            if ($min > $max) {
                $merged['min_price'] = $max;
            }
        }

        if ($merged !== []) {
            $this->merge($merged);
        }
    }
}
