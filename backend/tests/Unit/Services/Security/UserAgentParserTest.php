<?php

namespace Tests\Unit\Services\Security;

use App\Services\Security\UserAgentParser;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class UserAgentParserTest extends TestCase
{
    #[Test]
    public function it_parses_common_desktop_chrome_on_windows(): void
    {
        $parser = new UserAgentParser;

        $result = $parser->parse(
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        );

        $this->assertSame('desktop', $result['device_type']);
        $this->assertSame('Chrome', $result['browser']);
        $this->assertSame('120', $result['browser_version']);
        $this->assertSame('Windows', $result['platform']);
        $this->assertSame('10', $result['platform_version']);
    }

    #[Test]
    public function it_parses_mobile_safari_on_iphone(): void
    {
        $parser = new UserAgentParser;

        $result = $parser->parse(
            'Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1',
        );

        $this->assertSame('mobile', $result['device_type']);
        $this->assertSame('Safari', $result['browser']);
        $this->assertSame('iOS', $result['platform']);
        $this->assertSame('iPhone', $result['device_name']);
    }
}
