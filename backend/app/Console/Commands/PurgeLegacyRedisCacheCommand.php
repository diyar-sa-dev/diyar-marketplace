<?php

namespace App\Console\Commands;

use App\Support\Cache\LegacyRedisCachePurger;
use Illuminate\Console\Command;

class PurgeLegacyRedisCacheCommand extends Command
{
    protected $signature = 'diyar:purge-legacy-redis-cache {--json : Output machine-readable JSON}';

    protected $description = 'Purge Octane-unsafe legacy Redis cache entries (serialized Eloquent models)';

    public function handle(): int
    {
        try {
            $result = LegacyRedisCachePurger::purgeAllKnownLegacy();
        } catch (\Throwable $exception) {
            if ($this->option('json')) {
                $this->line(json_encode([
                    'ok' => false,
                    'error' => $exception->getMessage(),
                ], JSON_THROW_ON_ERROR));
            } else {
                $this->error('Failed to purge legacy Redis cache: '.$exception->getMessage());
            }

            return self::FAILURE;
        }

        if ($this->option('json')) {
            $this->line(json_encode([
                'ok' => true,
                'purged' => $result['purged'],
                'corrupt' => $result['corrupt'],
            ], JSON_THROW_ON_ERROR));

            return self::SUCCESS;
        }

        if ($result['purged'] === []) {
            $this->info('No legacy category cache keys found in Redis.');

            return self::SUCCESS;
        }

        $this->info('Purged legacy Redis cache keys: '.implode(', ', $result['purged']));

        if ($result['corrupt'] !== []) {
            $this->warn('Removed corrupt serialized objects from: '.implode(', ', $result['corrupt']));
        }

        return self::SUCCESS;
    }
}
