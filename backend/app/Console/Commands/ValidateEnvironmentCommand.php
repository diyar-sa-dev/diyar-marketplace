<?php

namespace App\Console\Commands;

use App\Services\Infrastructure\EnvironmentSafetyValidator;
use Illuminate\Console\Command;

class ValidateEnvironmentCommand extends Command
{
    protected $signature = 'diyar:validate-environment {--json : Output machine-readable JSON}';

    protected $description = 'Validate staging/production environment isolation and safety rules';

    public function handle(EnvironmentSafetyValidator $validator): int
    {
        $violations = $validator->violations();

        if ($this->option('json')) {
            $this->line(json_encode([
                'environment' => app()->environment(),
                'ok' => $violations === [],
                'violations' => $violations,
            ], JSON_THROW_ON_ERROR));

            return $violations === [] ? self::SUCCESS : self::FAILURE;
        }

        if ($violations === []) {
            $this->info('Environment safety checks passed for '.app()->environment().'.');

            return self::SUCCESS;
        }

        $this->error('Environment safety checks failed:');
        foreach ($violations as $violation) {
            $this->line(" - {$violation}");
        }

        return self::FAILURE;
    }
}
