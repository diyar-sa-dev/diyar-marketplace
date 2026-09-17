<?php

namespace Tests\Unit\Services\Media;

use App\Services\Media\MediaUploadService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MediaUploadServiceTest extends TestCase
{
    use RefreshDatabase;

    public function test_url_returns_relative_storage_path_for_existing_media(): void
    {
        Storage::fake('media');
        Storage::disk('media')->put('providers/test/avatar/foo.png', 'avatar');

        $url = app(MediaUploadService::class)->url('providers/test/avatar/foo.png');

        $this->assertSame('/storage/media/providers/test/avatar/foo.png', $url);
    }

    public function test_url_passthrough_external_urls(): void
    {
        $external = 'https://images.unsplash.com/photo-123';

        $url = app(MediaUploadService::class)->url($external);

        $this->assertSame($external, $url);
    }

    public function test_url_returns_null_when_media_file_is_missing(): void
    {
        Storage::fake('media');

        $url = app(MediaUploadService::class)->url('providers/missing/avatar/foo.png');

        $this->assertNull($url);
    }
}
