import type { ServiceRequestStatus } from '../types/serviceRequests.ts';

export function serviceRequestAccentClass(status: ServiceRequestStatus): string {
  switch (status) {
    case 'offers_received':
      return 'border-s-4 border-s-amber-400';
    case 'offer_accepted':
    case 'in_progress':
      return 'border-s-4 border-s-blue-500';
    case 'completed':
      return 'border-s-4 border-s-emerald-500';
    case 'cancelled':
      return 'border-s-4 border-s-red-400';
    default:
      return 'border-s-4 border-s-gray-300';
  }
}
