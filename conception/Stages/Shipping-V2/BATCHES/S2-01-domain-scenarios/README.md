# Batch S2-01: Domain Scenarios & Multi-Vendor Modeling

## 1. Overview
This batch analyzes and formalizes the domain scenarios for multi-vendor fulfillment, bulky furniture parcel restrictions, multi-package handling, and operational failure paths before provider contracts or database migrations are drafted.

## 2. Dependencies
- Prerequisite: `S2-00-baseline-audit` (COMPLETE).
- Next Batch: `S2-02-provider-verification`.

## 3. Scope of Scenarios Analyzed
1. Single customer, single seller, single parcel.
2. Single customer, multiple sellers, distinct physical origins.
3. Bulky furniture items exceeding parcel dimensional limits.
4. Missing product dimensions or weights.
5. Mixed checkout: one seller uses carrier API, another uses manual delivery.
6. Order cancellation before vs. after external carrier booking.
7. Cardinality evaluation: 1:1 vs. 1:N shipment package models.
