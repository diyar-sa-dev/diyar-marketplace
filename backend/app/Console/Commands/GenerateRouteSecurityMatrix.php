<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Routing\Route;
use Illuminate\Support\Facades\Route as RouteFacade;
use Illuminate\Support\Str;

class GenerateRouteSecurityMatrix extends Command
{
    protected $signature = 'diyar:security-matrix {--output= : Output markdown path relative to base path}';

    protected $description = 'Generate API route security matrix for Stage 20 audit';

    public function handle(): int
    {
        $rows = [];

        foreach (RouteFacade::getRoutes() as $route) {
            if (! $this->isApiRoute($route)) {
                continue;
            }

            $rows[] = $this->describeRoute($route);
        }

        usort($rows, fn (array $a, array $b) => [$a['path'], $a['method']] <=> [$b['path'], $b['method']]);

        $markdown = $this->toMarkdown($rows);
        $output = $this->option('output')
            ?: 'conception/Stages/Stage 20/ROUTE_SECURITY_MATRIX.md';

        $path = base_path($output);
        if (! is_dir(dirname($path))) {
            mkdir(dirname($path), 0755, true);
        }

        file_put_contents($path, $markdown);

        $this->info("Wrote {$output} (".count($rows).' routes)');

        return self::SUCCESS;
    }

    private function isApiRoute(Route $route): bool
    {
        $uri = $route->uri();

        return Str::startsWith($uri, 'api/');
    }

    /**
     * @return array<string, string>
     */
    private function describeRoute(Route $route): array
    {
        $middleware = collect($route->gatherMiddleware())->implode(', ');
        $action = $route->getActionName();

        return [
            'method' => implode('|', $route->methods()),
            'path' => '/'.$route->uri(),
            'auth' => $this->inferAuth($middleware),
            'role' => $this->inferRole($middleware),
            'permission' => $this->inferPermission($middleware),
            'rate_limit' => $this->inferRateLimit($middleware),
            'controller' => class_basename(Str::before($action, '@')),
            'tests' => 'see backend/tests',
        ];
    }

    private function inferAuth(string $middleware): string
    {
        if (Str::contains($middleware, 'auth:admin')) {
            return 'admin';
        }

        if (Str::contains($middleware, 'auth')) {
            return 'session';
        }

        return 'public';
    }

    private function inferRole(string $middleware): string
    {
        if (preg_match('/role:([^,\]]+)/', $middleware, $matches)) {
            return $matches[1];
        }

        return '—';
    }

    private function inferPermission(string $middleware): string
    {
        if (preg_match('/admin\.permission:([^,\]]+)/', $middleware, $matches)) {
            return $matches[1];
        }

        return '—';
    }

    private function inferRateLimit(string $middleware): string
    {
        foreach (['throttle:auth', 'throttle:otp', 'throttle:api', 'throttle:'] as $needle) {
            if (Str::contains($middleware, $needle)) {
                if (preg_match('/throttle:([^,\]]+)/', $middleware, $matches)) {
                    return $matches[1];
                }
            }
        }

        return 'default';
    }

    /**
     * @param  list<array<string, string>>  $rows
     */
    private function toMarkdown(array $rows): string
    {
        $lines = [
            '# API Route Security Matrix',
            '',
            '**Generated:** '.now()->toIso8601String(),
            '**Command:** `php artisan diyar:security-matrix`',
            '',
            '| Method | Path | Auth | Role | Permission | Rate limit | Controller | Tests |',
            '|--------|------|------|------|------------|------------|------------|-------|',
        ];

        foreach ($rows as $row) {
            $lines[] = sprintf(
                '| %s | `%s` | %s | %s | %s | %s | %s | %s |',
                $row['method'],
                $row['path'],
                $row['auth'],
                $row['role'],
                $row['permission'],
                $row['rate_limit'],
                $row['controller'],
                $row['tests'],
            );
        }

        $lines[] = '';

        return implode(PHP_EOL, $lines);
    }
}
