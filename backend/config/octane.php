<?php

/**
 * Octane configuration.
 * Safe to load when laravel/octane is not installed (local Windows without composer install).
 */
if (! class_exists(Octane::class)) {
    return [
        'server' => env('OCTANE_SERVER', 'swoole'),
        'https' => env('OCTANE_HTTPS', false),
        'listeners' => [],
        'warm' => [],
        'flush' => [],
        'cache' => [
            'rows' => 1000,
            'bytes' => 10000,
        ],
        'tables' => [],
        'swoole' => [],
        'roadrunner' => [
            'rpc' => env('OCTANE_ROADRUNNER_RPC', 'tcp://127.0.0.1:6001'),
        ],
        'frankenphp' => [
            'worker' => env('OCTANE_FRANKENPHP_WORKER', true),
        ],
        'watch' => [],
        'garbage' => 50,
        'max_execution_time' => 30,
    ];
}

use Laravel\Octane\Contracts\OperationTerminated;
use Laravel\Octane\Events\RequestHandled;
use Laravel\Octane\Events\RequestReceived;
use Laravel\Octane\Events\RequestTerminated;
use Laravel\Octane\Events\TaskReceived;
use Laravel\Octane\Events\TaskTerminated;
use Laravel\Octane\Events\TickReceived;
use Laravel\Octane\Events\TickTerminated;
use Laravel\Octane\Events\WorkerErrorOccurred;
use Laravel\Octane\Events\WorkerStarting;
use Laravel\Octane\Events\WorkerStopping;
use Laravel\Octane\Listeners\CloseMonologHandlers;
use Laravel\Octane\Listeners\CollectGarbage;
use Laravel\Octane\Listeners\DisconnectFromDatabases;
use Laravel\Octane\Listeners\EnsureUploadedFilesAreValid;
use Laravel\Octane\Listeners\EnsureUploadedFilesCanBeMoved;
use Laravel\Octane\Listeners\FlushOnce;
use Laravel\Octane\Listeners\FlushTemporaryContainerInstances;
use Laravel\Octane\Listeners\FlushUploadedFiles;
use Laravel\Octane\Listeners\ReportException;
use App\Listeners\Octane\FlushOctaneDevState;
use Laravel\Octane\Listeners\StopWorkerIfNecessary;
use Laravel\Octane\Octane;

return [

    'server' => env('OCTANE_SERVER', 'swoole'),

    'https' => env('OCTANE_HTTPS', false),

    'listeners' => [
        WorkerStarting::class => [
            EnsureUploadedFilesAreValid::class,
            EnsureUploadedFilesCanBeMoved::class,
        ],

        RequestReceived::class => [
            ...Octane::prepareApplicationForNextOperation(),
            ...Octane::prepareApplicationForNextRequest(),
        ],

        RequestHandled::class => [],

        RequestTerminated::class => [
            FlushUploadedFiles::class,
        ],

        TaskReceived::class => [
            ...Octane::prepareApplicationForNextOperation(),
        ],

        TaskTerminated::class => [],

        TickReceived::class => [
            ...Octane::prepareApplicationForNextOperation(),
        ],

        TickTerminated::class => [],

        OperationTerminated::class => [
            FlushOnce::class,
            FlushTemporaryContainerInstances::class,
            DisconnectFromDatabases::class,
            CollectGarbage::class,
            FlushOctaneDevState::class,
        ],

        WorkerErrorOccurred::class => [
            ReportException::class,
            StopWorkerIfNecessary::class,
        ],

        WorkerStopping::class => [
            CloseMonologHandlers::class,
        ],
    ],

    'warm' => [
        ...Octane::defaultServicesToWarm(),
    ],

    'flush' => [],

    'cache' => [
        'rows' => 1000,
        'bytes' => 10000,
    ],

    'tables' => [],

    'swoole' => [
        'options' => [
            'log_file' => storage_path('logs/swoole_http.log'),
            'package_max_length' => 10 * 1024 * 1024,
            'buffer_output_size' => 10 * 1024 * 1024,
            'socket_buffer_size' => 10 * 1024 * 1024,
            'max_request' => 1000,
            'send_yield' => true,
            'reload_async' => true,
        ],
    ],

    'roadrunner' => [
        'rpc' => env('OCTANE_ROADRUNNER_RPC', 'tcp://127.0.0.1:6001'),
    ],

    'frankenphp' => [
        'worker' => env('OCTANE_FRANKENPHP_WORKER', true),
    ],

    'watch' => [
        'app',
        'bootstrap',
        'config',
        'database',
        'public/**/*.php',
        'resources/**/*.php',
        'routes',
        'composer.lock',
        '.env',
    ],

    'garbage' => 50,

    'max_execution_time' => 30,

];
