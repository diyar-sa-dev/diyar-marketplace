<?php

namespace App\Http\Requests\Catalog;

use App\Http\Requests\Catalog\Concerns\PreparesCatalogFilterQuery;
use App\Support\Catalog\Filters\CatalogFilterNormalizer;
use App\Support\Catalog\Filters\CatalogFilterRuleBuilder;
use App\Support\Catalog\Filters\FilterSurface;
use Illuminate\Foundation\Http\FormRequest;

class CatalogSearchRequest extends FormRequest
{
    use PreparesCatalogFilterQuery;

    public function authorize(): bool
    {
        return true;
    }

    /**
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return app(CatalogFilterRuleBuilder::class)->rules(FilterSurface::CatalogSearch);
    }

    /**
     * @return array<string, mixed>
     */
    public function validatedFilters(): array
    {
        return app(CatalogFilterNormalizer::class)->normalizeForCatalogSearch($this->validated());
    }
}
