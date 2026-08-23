<?php

namespace App\Services\Chat;

use Closure;
use Illuminate\Contracts\Cache\LockTimeoutException;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

final class ChatLockService
{
    private function prefix(): string
    {
        return (string) config('diyar.chat.cache.prefix', 'diyar:chat:').'lock:';
    }

    /**
     * @template TReturn
     *
     * @param  Closure(): TReturn  $callback
     * @return TReturn|null
     */
    public function run(string $name, Closure $callback, int $seconds = 30, int $waitSeconds = 5): mixed
    {
        if (app()->environment('testing')) {
            return $callback();
        }

        $lock = Cache::lock($this->prefix().$name, $seconds);

        try {
            return $lock->block($waitSeconds, $callback);
        } catch (LockTimeoutException $exception) {
            Log::warning('chat.lock.timeout', [
                'lock' => $name,
                'error' => $exception->getMessage(),
            ]);

            return null;
        }
    }
}
