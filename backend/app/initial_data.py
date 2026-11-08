import logging
from asyncio import run

from app.core.config import settings
from app.core.db import async_session_maker, init_db
from app.dev.bootstrap import TENANT_ID, seed_application_demo_data

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def init() -> None:
    async with async_session_maker() as session:
        await init_db(session)
        if settings.ENVIRONMENT == "production" and settings.DEV_DATABASE_ENABLED:
            await seed_application_demo_data(session, tenant_id=TENANT_ID)


def main() -> None:
    logger.info("Creating initial data")
    run(init())
    logger.info("Initial data created")


if __name__ == "__main__":
    main()
