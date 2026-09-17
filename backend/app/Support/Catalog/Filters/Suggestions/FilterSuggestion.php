<?php

namespace App\Support\Catalog\Filters\Suggestions;

use App\Support\Catalog\Filters\FilterPresentation;

final readonly class FilterSuggestion
{
    /**
     * @param  list<string>  $queryParameters
     * @param  list<array{value: string, count?: int, share?: float}>  $values
     * @param  array{min?: float, max?: float, avg?: float}|null  $bounds
     */
    public function __construct(
        public string $filterKey,
        public FilterSuggestionGroup $group,
        public FilterPresentation $presentation,
        public int $priority,
        public FilterSuggestionAction $action,
        public FilterSuggestionReasonCode $reasonCode,
        public array $queryParameters,
        public array $values = [],
        public ?array $bounds = null,
        public ?string $label = null,
        public ?string $reason = null,
        public ?FilterSuggestionApply $apply = null,
        public string $source = 'ranked',
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return array_filter([
            'filter_key' => $this->filterKey,
            'group' => $this->group->value,
            'presentation' => $this->presentation->value,
            'priority' => $this->priority,
            'action' => $this->action->value,
            'reason_code' => $this->reasonCode->value,
            'label' => $this->label,
            'reason' => $this->reason,
            'query_parameters' => $this->queryParameters,
            'values' => $this->values,
            'bounds' => $this->bounds,
            'apply' => $this->apply?->toArray(),
            'source' => $this->source,
        ], static fn (mixed $value): bool => $value !== null && $value !== []);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            filterKey: (string) $data['filter_key'],
            group: FilterSuggestionGroup::from((string) $data['group']),
            presentation: FilterPresentation::from((string) $data['presentation']),
            priority: (int) $data['priority'],
            action: FilterSuggestionAction::from((string) $data['action']),
            reasonCode: FilterSuggestionReasonCode::from((string) $data['reason_code']),
            queryParameters: is_array($data['query_parameters'] ?? null) ? $data['query_parameters'] : [],
            values: is_array($data['values'] ?? null) ? $data['values'] : [],
            bounds: is_array($data['bounds'] ?? null) ? $data['bounds'] : null,
            label: isset($data['label']) ? (string) $data['label'] : null,
            reason: isset($data['reason']) ? (string) $data['reason'] : null,
            apply: is_array($data['apply'] ?? null) ? FilterSuggestionApply::fromArray($data['apply']) : null,
            source: (string) ($data['source'] ?? 'ranked'),
        );
    }
}
