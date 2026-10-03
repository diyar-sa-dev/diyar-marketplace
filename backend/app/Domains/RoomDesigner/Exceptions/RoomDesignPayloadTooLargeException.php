<?php

namespace App\Domains\RoomDesigner\Exceptions;

use Exception;

final class RoomDesignPayloadTooLargeException extends Exception
{
    public function __construct()
    {
        parent::__construct(__('diyar.room_designer.payload_too_large'));
    }
}
