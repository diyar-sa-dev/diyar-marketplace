<?php

namespace App\Domains\Identity\Contracts;

interface OtpCodeGenerator
{
    public function generate(int $length): string;
}
