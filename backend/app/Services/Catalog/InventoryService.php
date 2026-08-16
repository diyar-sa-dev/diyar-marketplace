<?php

namespace App\Services\Catalog;

use App\Enums\AvailabilityMode;
use App\Enums\InventoryMovementType;
use App\Enums\ReservationStatus;
use App\Models\InventoryReservation;
use App\Models\Product;
use App\Models\ProductInventory;
use App\Models\User;
use Illuminate\Support\Facades\DB;
use InvalidArgumentException;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;

final class InventoryService
{
    public function createInitial(Product $product, int $stockQuantity, ?User $actor = null): ProductInventory
    {
        return DB::transaction(function () use ($product, $stockQuantity, $actor) {
            $stockQuantity = max(0, $stockQuantity);

            $inventory = ProductInventory::query()->create([
                'product_id' => $product->id,
                'stock_quantity' => $stockQuantity,
                'reserved_quantity' => 0,
                'available_quantity' => $stockQuantity,
            ]);

            if ($stockQuantity > 0) {
                $this->recordMovement(
                    product: $product,
                    type: InventoryMovementType::Increase,
                    delta: $stockQuantity,
                    previousStock: 0,
                    resultingStock: $stockQuantity,
                    actor: $actor,
                    note: 'Initial stock',
                );
            }

            $inventory->assertInvariants();
            $this->syncAvailabilityMode($product, $inventory);

            return $inventory;
        });
    }

    /**
     * @param  array{type: string, quantity: int, note?: string|null}  $payload
     */
    public function adjust(Product $product, User $actor, array $payload): ProductInventory
    {
        $type = InventoryMovementType::from($payload['type']);
        $quantity = (int) $payload['quantity'];

        if ($type !== InventoryMovementType::Adjustment && $quantity <= 0) {
            throw new InvalidArgumentException(__('diyar.catalog.invalid_quantity'));
        }

        if ($type === InventoryMovementType::Adjustment && $quantity < 0) {
            throw new InvalidArgumentException(__('diyar.catalog.invalid_quantity'));
        }

        return DB::transaction(function () use ($product, $actor, $type, $quantity, $payload) {
            $inventory = $this->lockInventory($product);
            $previousStock = $inventory->stock_quantity;

            $delta = match ($type) {
                InventoryMovementType::Increase, InventoryMovementType::Return => $quantity,
                InventoryMovementType::Decrease, InventoryMovementType::Sale => -$quantity,
                InventoryMovementType::Adjustment => $quantity - $inventory->stock_quantity,
                default => throw new InvalidArgumentException(__('diyar.catalog.unsupported_movement')),
            };

            $newStock = $previousStock + $delta;
            if ($newStock < 0) {
                throw new InvalidArgumentException(__('diyar.catalog.insufficient_stock'));
            }

            if ($delta === 0) {
                return $inventory;
            }

            $inventory->update(['stock_quantity' => $newStock]);
            $inventory->syncAvailableQuantity();
            $inventory->assertInvariants();

            $this->recordMovement(
                product: $product,
                type: $type,
                delta: $delta,
                previousStock: $previousStock,
                resultingStock: $newStock,
                actor: $actor,
                note: $payload['note'] ?? null,
            );

            $this->syncAvailabilityMode($product->fresh(), $inventory->fresh());

            return $inventory->fresh();
        });
    }

    /**
     * @param  array{type?: class-string|null, id?: string|null}  $reference
     */
    public function reserve(
        Product $product,
        User $user,
        int $quantity,
        array $reference = [],
    ): InventoryReservation {
        if ($quantity <= 0) {
            throw new InvalidArgumentException(__('diyar.catalog.invalid_quantity'));
        }

        if ($product->availability_mode === AvailabilityMode::OutOfStock) {
            throw new InvalidArgumentException(__('diyar.catalog.product_out_of_stock'));
        }

        return DB::transaction(function () use ($product, $user, $quantity, $reference) {
            $product->refresh();
            $affectsInventory = $product->availability_mode !== AvailabilityMode::Preorder;
            $timeoutMinutes = (int) config('diyar.inventory.reservation_timeout_minutes', 15);

            if ($affectsInventory) {
                $inventory = $this->lockInventory($product);

                if ($inventory->computeAvailableQuantity() < $quantity) {
                    throw new InvalidArgumentException(__('diyar.catalog.insufficient_available_stock'));
                }

                $inventory->update([
                    'reserved_quantity' => $inventory->reserved_quantity + $quantity,
                ]);
                $inventory->syncAvailableQuantity();
                $inventory->assertInvariants();

                $reservation = InventoryReservation::query()->create([
                    'product_id' => $product->id,
                    'user_id' => $user->id,
                    'quantity' => $quantity,
                    'status' => ReservationStatus::Pending,
                    'affects_inventory' => true,
                    'reference_type' => $reference['type'] ?? null,
                    'reference_id' => $reference['id'] ?? null,
                    'expires_at' => now()->addMinutes($timeoutMinutes),
                ]);

                $this->recordMovement(
                    product: $product,
                    type: InventoryMovementType::Reservation,
                    delta: $quantity,
                    previousStock: $inventory->stock_quantity,
                    resultingStock: $inventory->stock_quantity,
                    actor: $user,
                    note: 'Stock reserved',
                    reference: $reservation,
                );

                return $reservation;
            }

            return InventoryReservation::query()->create([
                'product_id' => $product->id,
                'user_id' => $user->id,
                'quantity' => $quantity,
                'status' => ReservationStatus::Pending,
                'affects_inventory' => $affectsInventory,
                'reference_type' => $reference['type'] ?? null,
                'reference_id' => $reference['id'] ?? null,
                'expires_at' => now()->addMinutes($timeoutMinutes),
            ]);
        });
    }

    public function finalize(InventoryReservation $reservation, ?User $actor = null): InventoryReservation
    {
        return DB::transaction(function () use ($reservation, $actor) {
            $reservation = InventoryReservation::query()
                ->whereKey($reservation->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->assertReservationPending($reservation);

            $product = Product::query()->lockForUpdate()->findOrFail($reservation->product_id);

            if ($reservation->affects_inventory) {
                $inventory = $this->lockInventory($product);
                $previousStock = $inventory->stock_quantity;

                if ($inventory->reserved_quantity < $reservation->quantity) {
                    throw new InvalidArgumentException(__('diyar.catalog.reservation_inventory_mismatch'));
                }

                $newStock = $previousStock - $reservation->quantity;
                if ($newStock < 0) {
                    throw new InvalidArgumentException(__('diyar.catalog.insufficient_stock'));
                }

                $inventory->update([
                    'stock_quantity' => $newStock,
                    'reserved_quantity' => $inventory->reserved_quantity - $reservation->quantity,
                ]);
                $inventory->syncAvailableQuantity();
                $inventory->assertInvariants();

                $this->recordMovement(
                    product: $product,
                    type: InventoryMovementType::Sale,
                    delta: -$reservation->quantity,
                    previousStock: $previousStock,
                    resultingStock: $newStock,
                    actor: $actor ?? $reservation->user,
                    note: 'Reservation finalized',
                    reference: $reservation,
                );

                $this->syncAvailabilityMode($product->fresh(), $inventory->fresh());
            }

            $reservation->update([
                'status' => ReservationStatus::Finalized,
                'finalized_at' => now(),
            ]);

            return $reservation->fresh();
        });
    }

    public function release(
        InventoryReservation $reservation,
        ?User $actor = null,
        ReservationStatus $finalStatus = ReservationStatus::Released,
    ): InventoryReservation {
        return DB::transaction(function () use ($reservation, $actor, $finalStatus) {
            $reservation = InventoryReservation::query()
                ->whereKey($reservation->id)
                ->lockForUpdate()
                ->firstOrFail();

            $this->assertReservationPending($reservation);

            $product = Product::query()->lockForUpdate()->findOrFail($reservation->product_id);

            if ($reservation->affects_inventory) {
                $inventory = $this->lockInventory($product);
                $previousStock = $inventory->stock_quantity;

                if ($inventory->reserved_quantity < $reservation->quantity) {
                    throw new InvalidArgumentException(__('diyar.catalog.reservation_inventory_mismatch'));
                }

                $inventory->update([
                    'reserved_quantity' => $inventory->reserved_quantity - $reservation->quantity,
                ]);
                $inventory->syncAvailableQuantity();
                $inventory->assertInvariants();

                $this->recordMovement(
                    product: $product,
                    type: InventoryMovementType::Release,
                    delta: -$reservation->quantity,
                    previousStock: $previousStock,
                    resultingStock: $previousStock,
                    actor: $actor ?? $reservation->user,
                    note: $finalStatus === ReservationStatus::Expired
                        ? 'Reservation expired'
                        : 'Reservation released',
                    reference: $reservation,
                );

                $this->syncAvailabilityMode($product->fresh(), $inventory->fresh());
            }

            $reservation->update([
                'status' => $finalStatus,
                'released_at' => now(),
            ]);

            return $reservation->fresh();
        });
    }

    public function releaseExpiredReservations(): int
    {
        $released = 0;

        InventoryReservation::query()
            ->where('status', ReservationStatus::Pending)
            ->where('expires_at', '<=', now())
            ->orderBy('expires_at')
            ->chunkById(100, function ($reservations) use (&$released) {
                foreach ($reservations as $reservation) {
                    try {
                        $this->release($reservation, finalStatus: ReservationStatus::Expired);
                        $released++;
                    } catch (InvalidArgumentException) {
                        continue;
                    }
                }
            });

        return $released;
    }

    public function assertReservationOwnedBy(InventoryReservation $reservation, User $user): void
    {
        if ($reservation->user_id !== $user->id) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }
    }

    public function assertProductOwnership(User $user, Product $product): void
    {
        $vendorAccount = $user->vendorAccount;
        if ($vendorAccount === null || $product->vendor_account_id !== $vendorAccount->id) {
            throw new AccessDeniedHttpException(__('diyar.auth.forbidden'));
        }
    }

    private function lockInventory(Product $product): ProductInventory
    {
        return ProductInventory::query()
            ->where('product_id', $product->id)
            ->lockForUpdate()
            ->firstOrFail();
    }

    private function assertReservationPending(InventoryReservation $reservation): void
    {
        if (! $reservation->isPending()) {
            throw new InvalidArgumentException(__('diyar.catalog.reservation_not_pending'));
        }
    }

    private function syncAvailabilityMode(Product $product, ProductInventory $inventory): void
    {
        if ($product->availability_mode === AvailabilityMode::Preorder) {
            return;
        }

        $mode = $inventory->available_quantity > 0
            ? AvailabilityMode::InStock
            : AvailabilityMode::OutOfStock;

        if ($product->availability_mode !== $mode) {
            $product->forceFill(['availability_mode' => $mode])->save();
        }
    }

    private function recordMovement(
        Product $product,
        InventoryMovementType $type,
        int $delta,
        int $previousStock,
        int $resultingStock,
        ?User $actor = null,
        ?string $note = null,
        ?InventoryReservation $reference = null,
    ): void {
        $product->inventoryMovements()->create([
            'type' => $type,
            'quantity' => $delta,
            'previous_stock_quantity' => $previousStock,
            'resulting_stock_quantity' => $resultingStock,
            'note' => $note,
            'created_by' => $actor?->id,
            'reference_type' => $reference !== null ? $reference->getMorphClass() : null,
            'reference_id' => $reference?->id,
        ]);
    }
}
