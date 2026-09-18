import argparse
import logging
import sys
import uuid
from collections.abc import Callable, Generator

from sqlalchemy.orm import Session

from app.db.database import get_db
from app.services.billing.processor import BillingEventProcessor
from app.services.billing.provider import get_billing_provider

logger = logging.getLogger(__name__)


def run_worker(
    batch_size: int = 50,
    max_batches: int = 1,
    worker_id: str | None = None,
    lease_seconds: int = 300,
    session_factory: Callable[[], Generator[Session, None, None]] | None = None,
) -> int:
    """
    Bounded CLI worker execution loop for Phase 2B durable event processing.
    Executes up to `max_batches` of claimed events, then cleanly exits.
    Returns 0 on successful worker run, or 1 on unhandled system failure.

    ``session_factory`` is an optional callable that yields a SQLAlchemy
    Session.  When omitted the production ``get_db`` generator is used.
    Tests pass their own factory so the worker operates on the isolated
    in-memory database rather than the default on-disk one.
    """
    w_id = worker_id or f"worker_{uuid.uuid4().hex[:8]}"
    batches_run = 0
    total_processed = 0

    try:
        db_generator = session_factory() if session_factory is not None else get_db()
        db = next(db_generator)
        provider = get_billing_provider()
        processor = BillingEventProcessor(
            db=db,
            provider=provider,
            worker_id=w_id,
            lease_seconds=lease_seconds,
        )

        while batches_run < max_batches:
            claimed = processor.claim_pending_events(limit=batch_size)
            if not claimed:
                logger.info("No eligible pending/retryable events to claim.")
                break

            logger.info(f"Worker {w_id} claimed batch of {len(claimed)} events.")
            for item in claimed:
                try:
                    processor.process_single_claimed_event(item)
                    total_processed += 1
                except Exception as e:
                    logger.error(f"Event {item.event_id} failed during worker run: {e}")

            batches_run += 1

        logger.info(
            f"Worker {w_id} finished execution. Total processed: {total_processed}"
        )
        return 0

    except Exception as exc:
        logger.exception(f"Fatal error in billing worker {w_id}: {exc}")
        return 1


def main():
    parser = argparse.ArgumentParser(
        description="TrueFact News Billing Webhook Event Worker"
    )
    parser.add_argument(
        "--batch-size", type=int, default=50, help="Max events to claim per batch"
    )
    parser.add_argument(
        "--max-batches",
        type=int,
        default=1,
        help="Max batches to process before exiting",
    )
    parser.add_argument(
        "--worker-id", type=str, default=None, help="Unique worker instance ID"
    )
    parser.add_argument(
        "--lease-seconds", type=int, default=300, help="Lease claim duration in seconds"
    )

    args = parser.parse_args()
    exit_code = run_worker(
        batch_size=args.batch_size,
        max_batches=args.max_batches,
        worker_id=args.worker_id,
        lease_seconds=args.lease_seconds,
    )
    sys.exit(exit_code)


if __name__ == "__main__":
    main()
