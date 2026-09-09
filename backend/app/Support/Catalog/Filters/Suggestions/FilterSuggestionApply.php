<?php

namespace App\Support\Catalog\Filters\Suggestions;

final readonly class FilterSuggestionApply
{
    /**
     * @param  array<string, string|int|float|bool>  $set
     * @param  list<string>  $remove
     */
    public function __construct(
        public FilterSuggestionApplyMode $mode,
        public array $set = [],
        public array $remove = [],
        public ?string $focusFilterKey = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        return array_filter([
            'mode' => $this->mode->value,
            'set' => $this->set !== [] ? $this->set : null,
            'remove' => $this->remove !== [] ? $this->remove : null,
            'focus_filter_key' => $this->focusFilterKey,
        ], static fn (mixed $value): bool => $value !== null);
    }

    /**
     * @param  array<string, mixed>  $data
     */
    public static function fromArray(array $data): self
    {
        return new self(
            mode: FilterSuggestionApplyMode::from((string) $data['mode']),
            set: is_array($data['set'] ?? null) ? $data['set'] : [],
            remove: is_array($data['remove'] ?? null) ? $data['remove'] : [],
            focusFilterKey: isset($data['focus_filter_key']) ? (string) $data['focus_filter_key'] : null,
        );
    }
}
