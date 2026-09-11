<?php

namespace App\Support\Catalog\Filters;

final readonly class FilterCapability
{
    /**
     * @param  list<FilterOperator>  $operators
     * @param  list<string>  $queryParameters
     * @param  list<FilterSurface>  $surfaces
     * @param  list<string>|null  $enumValues
     */
    public function __construct(
        public string $key,
        public FilterContentType $contentType,
        public FilterValueType $valueType,
        public array $operators,
        public FilterPresentation $presentation,
        public array $queryParameters,
        public string $engineParameter,
        public ?string $facetSource,
        public bool $aiSuggestable,
        public bool $enabled,
        public array $surfaces,
        public ?array $enumValues = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return [
            'key' => $this->key,
            'content_type' => $this->contentType->value,
            'value_type' => $this->valueType->value,
            'operators' => array_map(static fn (FilterOperator $op): string => $op->value, $this->operators),
            'presentation' => $this->presentation->value,
            'query_parameters' => $this->queryParameters,
            'engine_parameter' => $this->engineParameter,
            'facet_source' => $this->facetSource,
            'ai_suggestable' => $this->aiSuggestable,
            'enabled' => $this->enabled,
            'surfaces' => array_map(static fn (FilterSurface $s): string => $s->value, $this->surfaces),
            'enum_values' => $this->enumValues,
        ];
    }
}
