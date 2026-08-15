# Service Marketplace Rules

> **Status:** Baseline — Stage 0

## Service Request

**Required:** description, at least one category, location  
**Optional:** budget range, reference links  
**Attachments:** JPG, PNG, JPEG, WEBP , PDF — max 10MB each

## Categories (initial)

- Interior design (تصميم داخلي)
- Installation/maintenance (تركيب/صيانة)
- Upholstery/renovation (تنجيد/ترميم)
- Architectural plans (مخططات)
- Transport/packing (نقل/تغليف)
- Other (أخرى)

## Offers

- Multiple providers may submit offers on one request
- Customer accepts **exactly one** offer
- On accept: other pending offers → `rejected`
- Accepted offer → creates `Booking`

## Booking

- Requires payment before service (V1: full payment unless deposit model confirmed)
- Provider can mark `completed`
- Customer may review after completion

## Provider Visibility

- Providers see requests matching their service areas/categories (V1: all open requests in category — refine later)
