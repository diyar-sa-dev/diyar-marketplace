<?php

namespace App\Services\Visualization\Support;

use GdImage;

final class StubTryInRoomCompositor
{
    /**
     * Place the product photo into the room photo (local stub — no external AI).
     */
    public function compose(string $roomBytes, ?string $productBytes): string
    {
        if (! extension_loaded('gd')) {
            return $this->fallbackPng();
        }

        $room = @imagecreatefromstring($roomBytes);
        if (! $room instanceof GdImage) {
            $room = $this->blankRoom();
        }

        imagesavealpha($room, true);

        if (is_string($productBytes) && $productBytes !== '') {
            $product = @imagecreatefromstring($productBytes);
            if ($product instanceof GdImage) {
                $this->overlayProduct($room, $product);
                imagedestroy($product);
            }
        }

        ob_start();
        imagepng($room, null, 6);
        $png = (string) ob_get_clean();
        imagedestroy($room);

        return $png !== '' ? $png : $this->fallbackPng();
    }

    public function blankRoomPng(): string
    {
        if (! extension_loaded('gd')) {
            return $this->fallbackPng();
        }

        $room = $this->blankRoom();
        ob_start();
        imagepng($room, null, 6);
        $png = (string) ob_get_clean();
        imagedestroy($room);

        return $png !== '' ? $png : $this->fallbackPng();
    }

    private function overlayProduct(GdImage $room, GdImage $product): void
    {
        $roomW = imagesx($room);
        $roomH = imagesy($room);
        $srcW = imagesx($product);
        $srcH = imagesy($product);
        if ($roomW < 8 || $roomH < 8 || $srcW < 1 || $srcH < 1) {
            return;
        }

        $targetW = max(16, (int) round($roomW * 0.32));
        $targetH = (int) round($srcH * ($targetW / $srcW));
        $maxH = (int) round($roomH * 0.55);
        if ($targetH > $maxH) {
            $targetH = max(16, $maxH);
            $targetW = (int) round($srcW * ($targetH / $srcH));
        }

        $dstX = (int) max(0, round(($roomW - $targetW) / 2));
        $dstY = (int) max(0, round($roomH - $targetH - ($roomH * 0.08)));

        imagealphablending($room, true);
        imagecopyresampled($room, $product, $dstX, $dstY, 0, 0, $targetW, $targetH, $srcW, $srcH);
    }

    private function blankRoom(): GdImage
    {
        $image = imagecreatetruecolor(960, 640);
        $floor = imagecolorallocate($image, 214, 201, 178);
        $wall = imagecolorallocate($image, 236, 229, 214);
        imagefilledrectangle($image, 0, 0, 959, 359, $wall);
        imagefilledrectangle($image, 0, 360, 959, 639, $floor);

        return $image;
    }

    private function fallbackPng(): string
    {
        return base64_decode(
            'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
            true,
        ) ?: '';
    }
}
