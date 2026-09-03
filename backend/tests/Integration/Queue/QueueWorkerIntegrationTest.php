<?php

namespace Tests\Integration\Queue;

use App\Jobs\Testing\QueueIntegrationProbeJob;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Queue;
use Illuminate\Support\Facades\Redis;
use PHPUnit\Framework\Attributes\Group;
use Symfony\Component\Process\Process;
use Tests\TestCase;

/**
 * Requires Redis queue backend and worker process.
 */
#[Group('queue-integration')]
class QueueWorkerIntegrationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();

        if (config('queue.default') !== 'redis') {
            $this->markTestSkipped('QUEUE_CONNECTION is not redis');
        }

        try {
            Redis::connection()->ping();
        } catch (\Throwable $e) {
            $this->markTestSkipped('Redis unreachable: '.$e->getMessage());
        }
    }

    public function test_redis_queue_job_is_processed_by_worker(): void
    {
        Queue::connection('redis')->clear('default');

        $token = bin2hex(random_bytes(8));
        $cacheKey = "queue:integration:probe:{$token}";

        Cache::forget($cacheKey);

        QueueIntegrationProbeJob::dispatch($token)->onConnection('redis');

        $this->assertGreaterThan(0, Queue::connection('redis')->size('default'));

        $process = new Process([
            PHP_BINARY,
            'artisan',
            'queue:work',
            'redis',
            '--once',
            '--stop-when-empty',
            '--queue=default',
        ], base_path());
        $process->setTimeout(60);
        $process->run();

        $this->assertTrue($process->isSuccessful(), $process->getErrorOutput().$process->getOutput());
        $this->assertNotNull(Cache::get($cacheKey), 'Worker did not execute probe job');
    }
}
