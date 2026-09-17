from datetime import datetime, timezone


def calculate_effective_tier(
    provider_status: str | None,
    local_status: str | None,
    access_until: datetime | None,
) -> str:
    """
    Determine effective entitlement tier from raw subscription state.
    Strictly enforces Phase 2C entitlement rules:
    - creating / creation_failed -> free
    - created / authenticated / pending -> free
    - paused / halted / expired -> free
    - active + future access_until -> pro
    - active without future access_until -> free
    - cancelled / completed + future access_until -> pro
    - cancelled / completed after access_until -> free
    - unknown or unhandled status -> free
    """
    if local_status in ("creating", "creation_failed"):
        return "free"

    if provider_status in (
        "created",
        "authenticated",
        "pending",
        "paused",
        "halted",
        "expired",
    ):
        return "free"

    now = datetime.now(timezone.utc)
    if access_until and access_until.tzinfo is None:
        access_until = access_until.replace(tzinfo=timezone.utc)

    if provider_status == "active":
        if access_until and access_until > now:
            return "pro"
        return "free"

    if provider_status in ("cancelled", "completed"):
        if access_until and access_until > now:
            return "pro"
        return "free"

    return "free"
