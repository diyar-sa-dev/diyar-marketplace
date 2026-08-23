<?php

namespace Database\Seeders\Concerns;

trait UsesDemoPassword
{
    protected function demoPassword(): string
    {
        return (string) config('diyar.demo.password');
    }
}
