<?php

namespace App\Services\Assistant;

use Illuminate\Http\Client\ConnectionException;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class AssistantChatService
{
    /**
     * @param  array<int, array{role: string, content: string}>  $messages
     */
    public function chat(array $messages, ?string $catalogContext, string $locale = 'ar'): string
    {
        if (! config('diyar.assistant.enabled')) {
            throw new RuntimeException('assistant_disabled');
        }

        $apiKey = config('diyar.assistant.api_key');
        if (! is_string($apiKey) || trim($apiKey) === '') {
            throw new RuntimeException('assistant_not_configured');
        }

        $systemPrompt = $this->buildSystemPrompt($catalogContext, $locale);

        $payloadMessages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ...array_map(
                static fn (array $message): array => [
                    'role' => $message['role'],
                    'content' => $message['content'],
                ],
                $messages,
            ),
        ];

        $request = Http::withToken($apiKey)->timeout(45);

        if (! config('diyar.assistant.verify_ssl')) {
            $request = $request->withOptions(['verify' => false]);
        }

        try {
            $response = $request->post('https://api.openai.com/v1/chat/completions', [
                'model' => config('diyar.assistant.model'),
                'messages' => $payloadMessages,
                'temperature' => 0.7,
                'max_tokens' => config('diyar.assistant.max_tokens'),
            ]);
        } catch (ConnectionException $exception) {
            Log::warning('assistant.openai_connection_failed', [
                'message' => $exception->getMessage(),
            ]);

            throw new RuntimeException('assistant_upstream_error');
        }

        if (! $response->successful()) {
            Log::warning('assistant.openai_error', [
                'status' => $response->status(),
                'body' => $response->json(),
            ]);

            throw new RuntimeException('assistant_upstream_error');
        }

        $content = data_get($response->json(), 'choices.0.message.content');

        if (! is_string($content) || trim($content) === '') {
            throw new RuntimeException('assistant_empty_response');
        }

        return trim($content);
    }

    private function buildSystemPrompt(?string $catalogContext, string $locale): string
    {
        $language = $locale === 'en'
            ? 'Respond in clear, friendly English.'
            : 'رد بالعربية الفصحى البسيطة والودودة.';

        $catalogBlock = $catalogContext
            ? "Use ONLY this Diyar marketplace catalog snapshot when recommending products, categories, or services. Do not invent items outside this list:\n\n{$catalogContext}"
            : 'You have no live catalog snapshot. Give general interior design advice and suggest browsing Diyar categories.';

        return <<<PROMPT
You are Diyar's personal interior design and furniture expert for Saudi homes.
Your role: help users choose furniture, coordinate colors, plan room layouts, and find suitable products/services on Diyar.
Tone: warm, concise, practical, premium but approachable.
Rules:
- {$language}
- Prefer actionable suggestions (colors, materials, layout tips, product types).
- When mentioning products from the catalog snapshot, include name and approximate price if available.
- Never claim real-time stock; tell users to verify on the product page.
- Keep answers under 180 words unless the user asks for more detail.
- If unsure, ask one clarifying question.

{$catalogBlock}
PROMPT;
    }
}
