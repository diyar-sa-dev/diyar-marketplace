<?php

namespace Tests\Feature\Api\V1\Assistant;

use App\Enums\SystemSettingGroup;
use App\Enums\SystemSettingType;
use App\Models\SystemSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class AssistantChatTest extends TestCase
{
    use RefreshDatabase;

    public function test_assistant_returns_503_when_disabled(): void
    {
        config(['diyar.assistant.enabled' => false]);

        $this->postJson('/api/v1/assistant/chat', [
            'messages' => [
                ['role' => 'user', 'content' => 'What sofas do you have?'],
            ],
        ])->assertStatus(503)
            ->assertJsonPath('success', false);
    }

    public function test_assistant_honors_admin_system_setting_disable(): void
    {
        config(['diyar.assistant.enabled' => true]);

        SystemSetting::query()->create([
            'group' => SystemSettingGroup::Platform->value,
            'key' => 'assistant_enabled',
            'value' => ['v' => false],
            'type' => SystemSettingType::Boolean->value,
            'is_public' => false,
        ]);

        $this->postJson('/api/v1/assistant/chat', [
            'messages' => [
                ['role' => 'user', 'content' => 'Hello'],
            ],
        ])->assertStatus(503);
    }

    public function test_assistant_returns_503_when_api_key_missing(): void
    {
        config([
            'diyar.assistant.enabled' => true,
            'diyar.assistant.provider' => 'openai',
            'diyar.assistant.use_fake' => false,
            'diyar.assistant.api_key' => null,
            'diyar.assistant.openai.api_key' => null,
        ]);

        $this->postJson('/api/v1/assistant/chat', [
            'messages' => [
                ['role' => 'user', 'content' => 'Hello'],
            ],
        ])->assertStatus(503);
    }

    public function test_assistant_validates_messages_required(): void
    {
        config(['diyar.assistant.enabled' => false]);

        $this->postJson('/api/v1/assistant/chat', [])
            ->assertStatus(422)
            ->assertJsonValidationErrors(['messages']);
    }

    public function test_assistant_validates_message_content_max_length(): void
    {
        config(['diyar.assistant.enabled' => false]);

        $this->postJson('/api/v1/assistant/chat', [
            'messages' => [
                ['role' => 'user', 'content' => str_repeat('a', 4001)],
            ],
        ])->assertStatus(422)
            ->assertJsonValidationErrors(['messages.0.content']);
    }

    public function test_assistant_returns_reply_when_configured(): void
    {
        config([
            'diyar.assistant.enabled' => true,
            'diyar.assistant.provider' => 'openai',
            'diyar.assistant.use_fake' => false,
            'diyar.assistant.api_key' => 'test-key',
            'diyar.assistant.openai.api_key' => 'test-key',
            'diyar.assistant.model' => 'gpt-4o-mini',
            'diyar.assistant.openai.model' => 'gpt-4o-mini',
        ]);

        Http::fake([
            'api.openai.com/*' => Http::response([
                'choices' => [
                    ['message' => ['content' => 'Welcome to DIYAR.']],
                ],
            ], 200),
        ]);

        $this->postJson('/api/v1/assistant/chat', [
            'messages' => [
                ['role' => 'user', 'content' => 'Hello'],
            ],
            'locale' => 'en',
        ])->assertOk()
            ->assertJsonPath('data.reply', 'Welcome to DIYAR.');
    }
}
