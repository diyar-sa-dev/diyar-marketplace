<?php

namespace Tests;

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    public function createApplication(): Application
    {
        $this->forceTestingEnvironment();

        return parent::createApplication();
    }

    protected function setUp(): void
    {
        parent::setUp();

        // Shell env from E2E/load tests must not disable rate limits during PHPUnit.
        config(['diyar.loadtest.enabled' => false]);
    }

    private function forceTestingEnvironment(): void
    {
        putenv('APP_ENV=testing');
        $_ENV['APP_ENV'] = 'testing';
        $_SERVER['APP_ENV'] = 'testing';
    }
}
