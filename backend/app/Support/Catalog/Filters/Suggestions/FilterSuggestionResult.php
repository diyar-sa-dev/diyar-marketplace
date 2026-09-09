<?php

namespace App\Support\Catalog\Filters\Suggestions;

final readonly class FilterSuggestionResult
{
    /**
     * @param  list<FilterSuggestion>  $suggestions
     * @param  list<FilterSuggestion>  $initializedFilters
     */
    public function __construct(
        public string $contentType,
        public int $resultCount,
        public string $resultDensity,
        public array $suggestions,
        public array $initializedFilters,
        public string $displayMode,
        public bool $degraded = false,
        public ?string $fallbackReason = null,
        public ?string $resolutionPath = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return array_filter([
            'content_type' => $this->contentType,
            'result_count' => $this->resultCount,
            'result_density' => $this->resultDensity,
            'display_mode' => $this->displayMode,
            'degraded' => $this->degraded ? true : null,
            'fallback_reason' => $this->fallbackReason,
            'resolution_path' => $this->resolutionPath,
            'suggestions' => array_map(
                static fn (FilterSuggestion $suggestion): array => $suggestion->toArray(),
                $this->suggestions,
            ),
            'initialized_filters' => array_map(
                static fn (FilterSuggestion $filter): array => $filter->toArray(),
                $this->initializedFilters,
            ),
        ], static fn (mixed $value): bool => $value !== null);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            contentType: (string) $data['content_type'],
            resultCount: (int) $data['result_count'],
            resultDensity: (string) ($data['result_density'] ?? 'unknown'),
            suggestions: array_map(
                static fn (array $suggestion): FilterSuggestion => FilterSuggestion::fromArray($suggestion),
                is_array($data['suggestions'] ?? null) ? $data['suggestions'] : [],
            ),
            initializedFilters: array_map(
                static fn (array $filter): FilterSuggestion => FilterSuggestion::fromArray($filter),
                is_array($data['initialized_filters'] ?? null) ? $data['initialized_filters'] : [],
            ),
            displayMode: (string) $data['display_mode'],
            degraded: (bool) ($data['degraded'] ?? false),
            fallbackReason: isset($data['fallback_reason']) ? (string) $data['fallback_reason'] : null,
            resolutionPath: isset($data['resolution_path']) ? (string) $data['resolution_path'] : null,
        );
    }
}
