<?php

namespace App\Domains\Catalog\Requests;

use App\Domains\Catalog\Requests\Concerns\PreparesCatalogFilterQuery;
use App\Domains\Catalog\Support\Filters\CatalogFilterNormalizer;
use App\Domains\Catalog\Support\Filters\CatalogFilterRuleBuilder;
use App\Domains\Catalog\Support\Filters\FilterSurface;
use Illuminate\Foundation\Http\FormRequest;

class ProductListRequest extends FormRequest
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
        return app(CatalogFilterRuleBuilder::class)->rules(FilterSurface::ProductListing);
    }

    /**
     * @return array<string, mixed>
     */
    public function validatedFilters(): array
    {
        return app(CatalogFilterNormalizer::class)->normalizeForProductListing($this->validated());
    }
}
