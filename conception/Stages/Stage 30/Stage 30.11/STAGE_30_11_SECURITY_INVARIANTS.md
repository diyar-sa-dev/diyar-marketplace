# Stage 30.11 — Security invariant contract

| Invariant | Evidence (PHPUnit) | Status |
|-----------|-------------------|--------|
| User cannot read another user's job | `TryInRoomTest::idor_poll_returns_not_found` | VERIFIED |
| Guest cannot create/poll | `TryInRoomTest::guest_cannot_create_or_poll` | VERIFIED |
| Feature disabled → 403 | `TryInRoomTest::feature_flag_disabled_returns_forbidden` | VERIFIED |
| Client cannot set `user_id` / `status` | `TryInRoomTest::client_cannot_set_status_via_mass_assignment` | VERIFIED |
| Idempotency mismatch → 409 | `TryInRoomSecurityTest::idempotency_key_reused_for_different_product_returns_conflict` | VERIFIED |
| Same idempotency key → one job (image bytes may differ) | `TryInRoomTest::idempotency_key_returns_same_job` | VERIFIED |
| Path traversal filename → safe storage path | `TryInRoomSecurityTest::malicious_filename_does_not_escape_user_storage_prefix` | VERIFIED |
| Poll JSON does not leak storage paths | `TryInRoomSecurityTest::poll_response_does_not_expose_storage_internals` | VERIFIED |
| Expired job does not stay queued | `TryInRoomSecurityTest::expired_queued_job_is_marked_failed_on_poll` (`error_code=expired`) | VERIFIED |
| Missing source → failed, no provider success | `TryInRoomSecurityTest::worker_marks_job_failed_when_source_file_missing` | VERIFIED |
| Duplicate worker → provider once | `TryInRoomWorkerConcurrencyTest::duplicate_worker_invocation_runs_provider_once` | VERIFIED |
| Atomic claim queued→processing | `TryInRoomWorkerConcurrencyTest::claim_for_processing_allows_only_one_transition_from_queued` | VERIFIED |
| Private disk config (no public URL key) | `TryInRoomInfrastructureTest::try_in_room_disk_is_private_without_public_url` | VERIFIED (config) |
| Rollback suppresses afterCommit dispatch | `TryInRoomInfrastructureTest::after_commit_dispatch_is_not_fired_when_transaction_rolls_back` | VERIFIED |
| Rate limiters registered | `TryInRoomInfrastructureTest::rate_limiters_are_registered` | VERIFIED (registration) |
| Invalid upload type rejected | `TryInRoomTest::rejects_invalid_image_type` | VERIFIED |
| EXIF strip on GD path | `TryInRoomStorageExifTest` | VERIFIED (GD path) |
| Nginx/public webroot exposure of `try-in-room` files | — | **NOT VERIFIED** (ops/deploy review) |
| HTTP 429 under saturation | — | **NOT VERIFIED** (load) |
| HTTP 500 infrastructure paths | — | **NOT VERIFIED** (integration) |
