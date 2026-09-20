<?php

namespace App\Services\Visualization;

/**
 * Hard gate before any user imagery leaves DIYAR for an external AI provider.
 * Approval is a committed repository artifact — not an env toggle.
 */
class VisualizationPrivacyGate
{
    public function allowsExternalImageTransfer(): bool
    {
        $path = $this->resolveApprovalFilePath();
        if ($path === null) {
            return false;
        }

        $contents = file_get_contents($path);
        if ($contents === false || $contents === '') {
            return false;
        }

        $statusLine = $this->extractCanonicalStatusLine($contents);
        if ($statusLine === null) {
            return false;
        }

        return strcasecmp(trim($statusLine), 'Status: APPROVED') === 0;
    }

    private function resolveApprovalFilePath(): ?string
    {
        $relative = str_replace(['/', '\\'], DIRECTORY_SEPARATOR, (string) config(
            'diyar.visualization.legal_approval_path',
            'conception/Stages/Stage 30/RoomDesigner/AI_VISUALIZATION_LEGAL_APPROVAL.md',
        ));

        $candidates = [
            base_path($relative),
            dirname(base_path()).DIRECTORY_SEPARATOR.$relative,
        ];

        foreach ($candidates as $path) {
            if (is_file($path)) {
                return $path;
            }
        }

        return null;
    }

    /**
     * Reads the first fenced block under "## Status" only (ignores example APPROVED text elsewhere).
     */
    private function extractCanonicalStatusLine(string $contents): ?string
    {
        if (! preg_match('/##\s*Status\s*[\r\n]+(?:```[^\r\n]*[\r\n])(.*?)(?:[\r\n]```)/s', $contents, $matches)) {
            return null;
        }

        $block = trim($matches[1]);
        if ($block === '') {
            return null;
        }

        $lines = preg_split('/\R/', $block) ?: [];
        foreach ($lines as $line) {
            $trimmed = trim($line);
            if ($trimmed !== '' && stripos($trimmed, 'Status:') === 0) {
                return $trimmed;
            }
        }

        return null;
    }
}
