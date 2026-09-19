<?php

namespace App\Exceptions\RoomDesign;

use Exception;

final class RoomDesignPayloadTooLargeException extends Exception
{
    public function __construct()
    {
        parent::__construct(__('diyar.room_designer.payload_too_large'));
    }
}
