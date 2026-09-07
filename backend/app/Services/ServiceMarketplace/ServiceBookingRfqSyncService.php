<?php

namespace App\Services\ServiceMarketplace;

use App\Enums\ServiceBookingPaymentStatus;
use App\Enums\ServiceBookingSource;
use App\Enums\ServiceOfferStatus;
use App\Enums\ServiceRequestStatus;
use App\Models\ServiceBooking;
use App\Models\ServiceOffer;
use App\Models\ServiceRequest;
use Illuminate\Support\Facades\DB;

final class ServiceBookingRfqSyncService
{
    public function reconcileAfterPrePaymentCancellation(ServiceBooking $booking): void
    {
        if ($booking->booking_source !== ServiceBookingSource::Rfq || $booking->service_request_id === null) {
            return;
        }

        if ($booking->payment_status === ServiceBookingPaymentStatus::Paid) {
            return;
        }

        DB::transaction(function () use ($booking) {
            $request = ServiceRequest::query()
                ->whereKey($booking->service_request_id)
                ->lockForUpdate()
                ->first();

            if ($request === null) {
                return;
            }

            if ($booking->service_offer_id !== null) {
                ServiceOffer::query()
                    ->whereKey($booking->service_offer_id)
                    ->where('status', ServiceOfferStatus::Accepted)
                    ->update(['status' => ServiceOfferStatus::Rejected]);
            }

            ServiceOffer::query()
                ->where('service_request_id', $request->id)
                ->when($booking->service_offer_id !== null, fn ($query) => $query->whereKeyNot($booking->service_offer_id))
                ->where('status', ServiceOfferStatus::Rejected)
                ->where(function ($query) {
                    $query->whereNull('expires_at')
                        ->orWhere('expires_at', '>', now());
                })
                ->update(['status' => ServiceOfferStatus::Pending]);

            $validPendingCount = ServiceOffer::query()
                ->where('service_request_id', $request->id)
                ->where('status', ServiceOfferStatus::Pending)
                ->where(function ($query) {
                    $query->whereNull('expires_at')
                        ->orWhere('expires_at', '>', now());
                })
                ->count();

            $request->update([
                'accepted_offer_id' => null,
                'status' => $validPendingCount > 0
                    ? ServiceRequestStatus::OffersReceived
                    : ServiceRequestStatus::Cancelled,
            ]);
        });
    }
}
