# Webhook Defect Remediation Plan

## Discovered Defect
While implementing the webhook security tests, a production defect was exposed in the Razorpay webhook endpoint (`app/routers/billing.py`).

The endpoint attempts to instantiate `BillingWebhookEventModel` with `payload` and `status` kwargs:
```python
new_event = BillingWebhookEventModel(
    provider="razorpay",
    provider_event_id=event_id,
    event_type=event_type,
    payload=payload,
    status="pending",
)
```
However, the model (`app/models/billing.py`) enforces strict PII/payload minimization and does not have these fields. It defines `payload_sha256` and `processing_status` instead. This mismatch currently causes an unhandled `TypeError` crash whenever a valid webhook signature is received.

## Remediation Steps
1. **Modify `app/routers/billing.py`**:
   - Import `hashlib`.
   - Calculate the SHA-256 hash of the raw webhook body.
   - Update the model instantiation to use `payload_sha256=hash_hex` and `processing_status="pending"`.

2. **Test Fixes**:
   - Correct the mock user class instantiation in `tests/test_billing.py` (`type("MockUser", (), {"id": uid})()`) to resolve a minor test harness `AttributeError`.

This isolated fix aligns the router implementation with the approved Phase 2A database schema without modifying the underlying architecture.
