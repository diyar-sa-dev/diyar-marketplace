<?php

namespace App\Exceptions\RoomDesign;

use App\Models\RoomDesign;
use Exception;

final class RoomDesignVersionConflictException extends Exception
{
    public function __construct(
        public readonly RoomDesign $design,
    ) {
        parent::__construct(__('diyar.room_designer.version_conflict'));
    }
}
