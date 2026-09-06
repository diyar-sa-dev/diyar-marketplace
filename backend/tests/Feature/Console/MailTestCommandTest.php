<?php

namespace Tests\Feature\Console;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MailTestCommandTest extends TestCase
{
    use RefreshDatabase;

    public function test_mail_test_command_rejects_invalid_email(): void
    {
        $this->artisan('mail:test', ['recipient' => 'not-an-email'])
            ->assertFailed();
    }

    public function test_mail_test_command_sends_to_valid_recipient(): void
    {
        config(['mail.default' => 'array']);

        $this->artisan('mail:test', ['recipient' => 'ops@example.com'])
            ->assertSuccessful();
    }
}
