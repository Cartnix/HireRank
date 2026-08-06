import logging
from asyncio import run

from app.core.db import async_session_maker, init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


async def init() -> None:
    async with async_session_maker() as session:
        await init_db(session)


def main() -> None:
    logger.info("Creating initial data")
    run(init())
    logger.info("Initial data created")


if __name__ == "__main__":
    main()
