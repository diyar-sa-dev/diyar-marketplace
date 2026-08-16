<?php

namespace App\Contracts\Identity;

interface OtpCodeGenerator
{
    public function generate(int $length): string;
}
