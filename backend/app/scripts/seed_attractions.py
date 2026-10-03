"""
Ensure the `attractions` table is filled with Kraków monuments / tourist attractions.

If the table is empty (or --force is given), data is (re)fetched from the Overpass API
and the table is replaced atomically: data is fetched *before* anything is deleted, so a
failed API call never wipes existing rows.

Usage:
    python -m app.scripts.seed_attractions           # seed only if empty
    python -m app.scripts.seed_attractions --force   # always refetch & replace
    python -m app.scripts.seed_attractions --min-count 500
"""
import argparse
import logging
import sys

from sqlalchemy import func
from sqlalchemy.orm import Session

import app.db.base  # noqa: F401  - registers all models on Base
from app.db.session import Base, SessionLocal, engine
from app.models.attraction import Attraction
from app.services.overpass import fetch_krakow_attractions

logger = logging.getLogger(__name__)


def attractions_count(db: Session) -> int:
    return db.query(func.count(Attraction.id)).scalar() or 0


def regenerate_attractions(db: Session) -> int:
    """Fetch from Overpass and replace all rows in a single transaction."""
    items = fetch_krakow_attractions()
    if not items:
        raise RuntimeError("Overpass returned no attractions - refusing to wipe the table")

    try:
        db.query(Attraction).delete()
        db.bulk_insert_mappings(Attraction, items)
        db.commit()
    except Exception:
        db.rollback()
        raise
    logger.info("Stored %d attractions", len(items))
    return len(items)


def ensure_attractions_seeded(force: bool = False, min_count: int = 1) -> int:
    """
    Seed the attractions table if it has fewer than `min_count` rows (or if `force`).
    Returns the number of rows in the table afterwards.
    """
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        count = attractions_count(db)
        if not force and count >= min_count:
            logger.info("Attractions table already filled (%d rows) - skipping", count)
            return count
        logger.info(
            "Attractions table has %d rows (min %d, force=%s) - fetching from Overpass",
            count, min_count, force,
        )
        return regenerate_attractions(db)
    finally:
        db.close()


def seed_on_startup() -> None:
    """Safe wrapper for app startup: never raises, just logs."""
    try:
        ensure_attractions_seeded()
    except Exception:
        logger.exception("Seeding attractions on startup failed")


def main() -> int:
    parser = argparse.ArgumentParser(description="Seed Kraków attractions from Overpass API")
    parser.add_argument("--force", action="store_true", help="Refetch even if table is filled")
    parser.add_argument(
        "--min-count", type=int, default=1,
        help="Refetch if the table has fewer rows than this (default: 1)",
    )
    args = parser.parse_args()

    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(name)s: %(message)s")
    try:
        total = ensure_attractions_seeded(force=args.force, min_count=args.min_count)
    except Exception as exc:
        logger.error("Seeding failed: %s", exc)
        return 1
    print(f"Attractions in database: {total}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
