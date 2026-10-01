<?php

namespace App\Domains\Search\Requests;

use App\Domains\Catalog\Requests\Concerns\PreparesCatalogFilterQuery;
use App\Domains\Catalog\Support\Filters\CatalogFilterNormalizer;
use App\Domains\Catalog\Support\Filters\CatalogFilterRuleBuilder;
use App\Domains\Catalog\Support\Filters\FilterSurface;
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
        $rules = app(CatalogFilterRuleBuilder::class)->rules(FilterSurface::CatalogSearch);
        $rules['product_page'] = ['nullable', 'integer', 'min:1'];
        $rules['service_page'] = ['nullable', 'integer', 'min:1'];

        return $rules;
    }

    /**
     * @return array<string, mixed>
     */
    public function validatedFilters(): array
    {
        return app(CatalogFilterNormalizer::class)->normalizeForCatalogSearch($this->validated());
    }
}
