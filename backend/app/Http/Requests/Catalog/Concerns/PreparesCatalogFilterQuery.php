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

        if ($merged !== []) {
            $this->merge($merged);
        }
    }
}
