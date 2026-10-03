# Import all the models, so that Base has them before being
# imported by Alembic or application startup
from app.db.session import Base  # noqa
from app.models.attraction import Attraction  # noqa
