<?php

namespace App\Domains\SpatialLayout\Exceptions;

use Exception;

final class VisualizationProviderException extends Exception
{
    public function __construct(
        public readonly string $failureCode,
        string $message = '',
    ) {
        parent::__construct($message !== '' ? $message : $failureCode);
    }
}
