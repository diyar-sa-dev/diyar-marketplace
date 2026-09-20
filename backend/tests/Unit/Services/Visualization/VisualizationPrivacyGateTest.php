<?php

namespace Tests\Unit\Services\Visualization;

use App\Services\Visualization\VisualizationPrivacyGate;
use PHPUnit\Framework\Attributes\Test;
use Tests\TestCase;

class VisualizationPrivacyGateTest extends TestCase
{
    #[Test]
    public function gate_is_closed_when_official_approval_file_is_pending(): void
    {
        config([
            'diyar.visualization.legal_approval_path' => 'conception/Stages/Stage 30/RoomDesigner/AI_VISUALIZATION_LEGAL_APPROVAL.md',
        ]);

        $this->assertFalse(app(VisualizationPrivacyGate::class)->allowsExternalImageTransfer());
    }

    #[Test]
    public function gate_ignores_example_approved_line_outside_status_block(): void
    {
        $relative = 'storage/framework/testing/viz-legal-pending-with-example.md';
        $path = base_path($relative);
        if (! is_dir(dirname($path))) {
            mkdir(dirname($path), 0777, true);
        }

        file_put_contents($path, <<<'MD'
## Status

```text
Status: PENDING
```

Example when approved:

```text
Status: APPROVED
```
MD);

        config(['diyar.visualization.legal_approval_path' => $relative]);

        $this->assertFalse(app(VisualizationPrivacyGate::class)->allowsExternalImageTransfer());

        @unlink($path);
    }

    #[Test]
    public function gate_opens_only_when_canonical_status_block_is_approved(): void
    {
        $relative = 'storage/framework/testing/viz-legal-approved.md';
        $path = base_path($relative);
        if (! is_dir(dirname($path))) {
            mkdir(dirname($path), 0777, true);
        }

        file_put_contents($path, <<<'MD'
## Status

```text
Status: APPROVED
```
MD);

        config(['diyar.visualization.legal_approval_path' => $relative]);

        $this->assertTrue(app(VisualizationPrivacyGate::class)->allowsExternalImageTransfer());

        @unlink($path);
    }

    #[Test]
    public function gate_is_closed_for_rejected_status(): void
    {
        $relative = 'storage/framework/testing/viz-legal-rejected.md';
        $path = base_path($relative);
        if (! is_dir(dirname($path))) {
            mkdir(dirname($path), 0777, true);
        }

        file_put_contents($path, <<<'MD'
## Status

```text
Status: REJECTED
```
MD);

        config(['diyar.visualization.legal_approval_path' => $relative]);

        $this->assertFalse(app(VisualizationPrivacyGate::class)->allowsExternalImageTransfer());

        @unlink($path);
    }
}
