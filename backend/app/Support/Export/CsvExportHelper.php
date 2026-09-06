<?php

namespace App\Support\Export;

final class CsvExportHelper
{
    /**
     * Neutralize spreadsheet formula injection for CSV cells.
     */
    public static function sanitizeCell(mixed $value): string
    {
        if ($value === null) {
            return '';
        }

        $string = (string) $value;

        if ($string === '') {
            return '';
        }

        if (in_array($string[0], ['=', '+', '-', '@', "\t", "\r"], true)) {
            return "'".$string;
        }

        return $string;
    }
}
