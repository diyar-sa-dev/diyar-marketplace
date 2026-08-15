<?php

return [

    /*
    |--------------------------------------------------------------------------
    | DIYAR Application Metadata
    |--------------------------------------------------------------------------
    |
    | Non-business configuration used by health checks, logging context,
    | and API metadata. Business rules belong in domain modules (Stage 2+).
    |
    */

    'api_version' => env('DIYAR_API_VERSION', '1.0.0-stage1'),

    'stage' => env('DIYAR_STAGE', 'Stage 1 — Engineering Foundation'),

    'frontend_url' => env('FRONTEND_URL', 'http://localhost:3000'),

];
