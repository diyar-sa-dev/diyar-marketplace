<?php

namespace App\Services\Assistant;

use App\Services\Settings\EffectiveConfigService;
use Illuminate\Http\Client\ConnectionException;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class AssistantChatService
{
    public function __construct(
        private readonly EffectiveConfigService $config,
        private readonly AssistantSystemPromptBuilder $prompts,
    ) {}

    /**
     * @param  array<int, array{role: string, content: string, image?: string|null}>  $messages
     */
    public function chat(array $messages, ?string $catalogContext, string $locale = 'ar'): string
    {
        if (! $this->isEnabled()) {
            throw new RuntimeException('assistant_disabled');
        }

        if ($this->useFakeAssistant()) {
            return $this->fakeReply($messages, $locale);
        }

        $apiKey = $this->resolveApiKey();
        if ($apiKey === null) {
            throw new RuntimeException('assistant_not_configured');
        }

        $systemPrompt = $this->prompts->build($catalogContext, $locale);

        return match ($this->provider()) {
            'google', 'gemini' => $this->chatWithGemini($messages, $systemPrompt, $apiKey),
            default => $this->chatWithOpenAi($messages, $systemPrompt, $apiKey),
        };
    }

    public function isEnabled(): bool
    {
        return $this->config->boolean(
            'platform.assistant_enabled',
            (bool) config('diyar.assistant.enabled', false),
        );
    }

    private function useFakeAssistant(): bool
    {
        return (bool) config('diyar.assistant.use_fake', false);
    }

    /**
     * @param  array<int, array{role: string, content: string, image?: string|null}>  $messages
     */
    private function fakeReply(array $messages, string $locale): string
    {
        $lastUser = '';
        foreach (array_reverse($messages) as $message) {
            if (($message['role'] ?? '') === 'user') {
                $lastUser = trim((string) ($message['content'] ?? ''));
                break;
            }
        }

        if ($locale === 'en') {
            return $lastUser === ''
                ? 'Welcome to DIYAR design assistant (local demo mode). Tell me about your room or style preferences.'
                : "Thanks for sharing. In local demo mode I cannot call OpenAI yet, but I can help you browse Diyar catalog for: {$lastUser}";
        }

        return $lastUser === ''
            ? 'مرحباً بك في مساعد ديار للتصميم (وضع تجريبي محلي). أخبرني عن غرفتك أو ذوقك في الأثاث.'
            : "شكراً لمشاركتك. في الوضع التجريبي المحلي لا أتصل بـ OpenAI بعد، لكن يمكنني مساعدتك في تصفح منتجات ديار بخصوص: {$lastUser}";
    }

    /**
     * @param  array<int, array{role: string, content: string, image?: string|null}>  $messages
     */
    private function chatWithOpenAi(array $messages, string $systemPrompt, string $apiKey): string
    {
        $payloadMessages = [
            ['role' => 'system', 'content' => $systemPrompt],
            ...array_map(
                fn (array $message): array => [
                    'role' => $message['role'],
                    'content' => $this->buildOpenAiContent($message),
                ],
                $messages,
            ),
        ];

        try {
            $response = $this->httpClient()
                ->withToken($apiKey)
                ->post('https://api.openai.com/v1/chat/completions', [
                    'model' => (string) (config('diyar.assistant.openai.model') ?? config('diyar.assistant.model')),
                    'messages' => $payloadMessages,
                    'temperature' => (float) config('diyar.assistant.openai.temperature', 0.7),
                    'max_tokens' => (int) config('diyar.assistant.max_tokens', 700),
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

        return $this->assertNonEmptyReply($content);
    }

    /**
     * @param  array<int, array{role: string, content: string, image?: string|null}>  $messages
     */
    private function chatWithGemini(array $messages, string $systemPrompt, string $apiKey): string
    {
        $model = (string) config('diyar.assistant.google.model');
        $url = "https://generativelanguage.googleapis.com/v1beta/models/{$model}:generateContent";

        $contents = [];
        foreach ($messages as $message) {
            $role = $message['role'] === 'assistant' ? 'model' : 'user';
            $contents[] = [
                'role' => $role,
                'parts' => $this->buildGeminiParts($message),
            ];
        }

        if ($contents === []) {
            $contents[] = [
                'role' => 'user',
                'parts' => [['text' => 'Hello']],
            ];
        }

        try {
            $response = $this->httpClient()
                ->post("{$url}?key=".urlencode($apiKey), [
                    'systemInstruction' => [
                        'parts' => [
                            ['text' => $systemPrompt],
                        ],
                    ],
                    'contents' => $contents,
                    'generationConfig' => [
                        'temperature' => (float) config('diyar.assistant.google.temperature', 0.7),
                        'maxOutputTokens' => (int) config('diyar.assistant.max_tokens', 700),
                    ],
                ]);
        } catch (ConnectionException $exception) {
            Log::warning('assistant.gemini_connection_failed', [
                'message' => $exception->getMessage(),
            ]);

            throw new RuntimeException('assistant_upstream_error');
        }

        if (! $response->successful()) {
            Log::warning('assistant.gemini_error', [
                'status' => $response->status(),
                'body' => $response->json(),
            ]);

            throw new RuntimeException('assistant_upstream_error');
        }

        $content = data_get($response->json(), 'candidates.0.content.parts.0.text');

        return $this->assertNonEmptyReply($content);
    }

    private function assertNonEmptyReply(mixed $content): string
    {
        if (! is_string($content) || trim($content) === '') {
            throw new RuntimeException('assistant_empty_response');
        }

        return trim($content);
    }

    private function provider(): string
    {
        return strtolower((string) config('diyar.assistant.provider', 'openai'));
    }

    /**
     * @param  array{role: string, content: string, image?: string|null}  $message
     * @return list<array<string, mixed>>
     */
    private function buildGeminiParts(array $message): array
    {
        $parts = [
            ['text' => (string) $message['content']],
        ];

        $inlineImage = $this->parseImageDataUrl($message['image'] ?? null);
        if ($inlineImage !== null) {
            $parts[] = [
                'inline_data' => [
                    'mime_type' => $inlineImage['mime_type'],
                    'data' => $inlineImage['data'],
                ],
            ];
        }

        return $parts;
    }

    /**
     * @param  array{role: string, content: string, image?: string|null}  $message
     * @return string|list<array<string, mixed>>
     */
    private function buildOpenAiContent(array $message): string|array
    {
        $image = $message['image'] ?? null;
        if (! is_string($image) || trim($image) === '') {
            return (string) $message['content'];
        }

        return [
            ['type' => 'text', 'text' => (string) $message['content']],
            ['type' => 'image_url', 'image_url' => ['url' => trim($image)]],
        ];
    }

    /**
     * @return array{mime_type: string, data: string}|null
     */
    private function parseImageDataUrl(?string $dataUrl): ?array
    {
        if (! is_string($dataUrl) || trim($dataUrl) === '') {
            return null;
        }

        if (! preg_match('#^data:(image/(?:jpeg|jpg|png|webp));base64,([A-Za-z0-9+/=]+)$#', trim($dataUrl), $matches)) {
            return null;
        }

        $mimeType = strtolower($matches[1]) === 'image/jpg' ? 'image/jpeg' : strtolower($matches[1]);

        return [
            'mime_type' => $mimeType,
            'data' => $matches[2],
        ];
    }

    private function resolveApiKey(): ?string
    {
        $key = match ($this->provider()) {
            'google', 'gemini' => config('diyar.assistant.google.api_key'),
            default => config('diyar.assistant.openai.api_key') ?? config('diyar.assistant.api_key'),
        };

        if (! is_string($key) || trim($key) === '') {
            return null;
        }

        return trim($key);
    }

    private function httpClient(): PendingRequest
    {
        $request = Http::connectTimeout(10)->timeout(45);

        if (! config('diyar.assistant.verify_ssl')) {
            $request = $request->withOptions(['verify' => false]);
        }

        return $request;
    }
}
