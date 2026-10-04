from sqlalchemy import func

from app.db.session import SessionLocal
from app.models.attraction import Attraction, AttractionLike


# Demonstracyjne wyniki popularności dla najbardziej znanych atrakcji.
# Wartości są celowo różne, aby lista miała stabilną kolejność startową.
FEATURED_ATTRACTION_LIKES = {
    "Zamek Królewski na Wawelu": 100,
    "Rynek Główny": 96,
    "Sukiennice": 93,
    "Rynek Podziemny": 89,
    "Barbakan": 86,
    "Brama Floriańska": 82,
    "Smok Wawelski": 79,
    "Fabryka Emalia Oskara Schindlera": 76,
    "Stara Synagoga": 72,
    "Collegium Maius": 69,
    "Muzeum Książąt Czartoryskich w Krakowie": 66,
    "Muzeum Narodowe w Krakowie": 63,
    "Kopiec Kościuszki": 59,
    "Planty": 55,
    "Zakrzówek": 50,
}

SEED_VISITOR_PREFIX = "featured-seed:"


def seed_featured_likes() -> None:
    """Create missing demo votes without duplicating them on app restarts."""
    db = SessionLocal()
    try:
        likes_to_create = []

        for rank, (name, target_count) in enumerate(
            FEATURED_ATTRACTION_LIKES.items(),
            start=1,
        ):
            attraction = (
                db.query(Attraction)
                .filter(func.lower(Attraction.name) == name.lower())
                .order_by(Attraction.id)
                .first()
            )
            if attraction is None:
                continue

            existing_seed_count = (
                db.query(func.count(AttractionLike.id))
                .filter(
                    AttractionLike.attraction_id == attraction.id,
                    AttractionLike.visitor_id.like(f"{SEED_VISITOR_PREFIX}%"),
                )
                .scalar()
                or 0
            )

            for vote_number in range(existing_seed_count + 1, target_count + 1):
                likes_to_create.append(
                    AttractionLike(
                        attraction_id=attraction.id,
                        visitor_id=(
                            f"{SEED_VISITOR_PREFIX}{rank:02d}:{vote_number:03d}"
                        ),
                    )
                )

        if likes_to_create:
            db.bulk_save_objects(likes_to_create)
            db.commit()
    finally:
        db.close()
