<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

Route::get('/sanctum/csrf-cookie', function () {
    return response()->noContent();
})->middleware('web');

Route::get('/storage/{path}', function (string $path) {
    $fullPath = storage_path('app/public/'.str_replace('\\', '/', $path));
    if (! file_exists($fullPath) || is_dir($fullPath)) {
        abort(404);
    }

    $mimeType = mime_content_type($fullPath) ?: 'application/octet-stream';
    if (str_ends_with(strtolower($path), '.glb')) {
        $mimeType = 'model/gltf-binary';
    } elseif (str_ends_with(strtolower($path), '.gltf')) {
        $mimeType = 'model/gltf+json';
    } elseif (str_ends_with(strtolower($path), '.webp')) {
        $mimeType = 'image/webp';
    }

    return response()->file($fullPath, [
        'Content-Type' => $mimeType,
        'Access-Control-Allow-Origin' => '*',
        'Cache-Control' => 'public, max-age=86400',
    ]);
})->where('path', '.*');
