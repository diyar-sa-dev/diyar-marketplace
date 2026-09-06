<?php

namespace App\Console\Commands;

use App\Services\Infrastructure\PhpRuntimeValidator;
use Illuminate\Console\Command;

class ValidatePhpRuntimeCommand extends Command
{
    protected $signature = 'diyar:validate-php-runtime {--json : Output machine-readable JSON}';

    protected $description = 'Verify required PHP extensions (including BCMath) for production runtime';

    public function handle(PhpRuntimeValidator $validator): int
    {
        $missingRequired = $validator->missingRequired();
        $missingRecommended = $validator->missingRecommended();
        $snapshot = $validator->snapshot();

        if ($this->option('json')) {
            $this->line(json_encode([
                'ok' => $missingRequired === [],
                'snapshot' => $snapshot,
                'missing_required' => $missingRequired,
                'missing_recommended' => $missingRecommended,
            ], JSON_THROW_ON_ERROR));

            return $missingRequired === [] ? self::SUCCESS : self::FAILURE;
        }

        $this->info('PHP '.PHP_VERSION);

        if ($missingRequired === []) {
            $this->info('Required extensions: OK (including bcmath)');
        } else {
            $this->error('Missing required extensions: '.implode(', ', $missingRequired));

            return self::FAILURE;
        }

        if ($missingRecommended !== []) {
            $this->warn('Missing recommended extensions: '.implode(', ', $missingRecommended));
        }

        $this->line('OPcache enabled: '.($snapshot['opcache_enabled'] ? 'yes' : 'no'));

        return self::SUCCESS;
    }
}
