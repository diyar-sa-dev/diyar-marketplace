<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Symfony\Component\Process\Process;

final class RunFrontendDevCommand extends Command
{
    protected $signature = 'diyar:dev-frontend';

    protected $description = 'Start the React frontend Vite dev server';

    public function handle(): int
    {
        $frontendPath = realpath(base_path('../frontend'));

        if ($frontendPath === false || ! is_dir($frontendPath)) {
            $this->error('Frontend directory not found.');

            return self::FAILURE;
        }

        $npm = PHP_OS_FAMILY === 'Windows' ? 'npm.cmd' : 'npm';

        $process = new Process([$npm, 'run', 'dev'], $frontendPath, null, null, null);
        $process->setTty(Process::isTtySupported());

        return $process->run(function (string $type, string $buffer): void {
            $this->output->write($buffer);
        });
    }
}
