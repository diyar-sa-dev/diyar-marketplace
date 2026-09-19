<?php

namespace Tests\Unit\Services\TryInRoom;

use App\Models\User;
use App\Services\TryInRoom\TryInRoomStorageService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class TryInRoomStorageExifTest extends TestCase
{
    use RefreshDatabase;

    #[Test]
    public function stored_jpeg_is_reencoded_without_exif_app1_segment_when_gd_available(): void
    {
        if (! extension_loaded('gd')) {
            $this->markTestSkipped('GD extension required.');
        }

        Storage::fake('try_in_room');

        $user = User::factory()->create();
        $png = $this->samplePngBytes();
        $upload = UploadedFile::fake()->createWithContent('room.png', $png, 'image/png');

        $source = app(TryInRoomStorageService::class)->storeUpload($user, $upload);
        $stored = Storage::disk('try_in_room')->get($source->path);

        $this->assertIsString($stored);
        $this->assertStringNotContainsString('Exif', $stored);
    }

    private function samplePngBytes(): string
    {
        $image = imagecreatetruecolor(8, 8);
        ob_start();
        imagepng($image);
        $bytes = (string) ob_get_clean();
        imagedestroy($image);

        return $bytes;
    }
}
