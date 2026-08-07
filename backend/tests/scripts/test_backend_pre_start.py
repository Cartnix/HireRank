from unittest.mock import AsyncMock, MagicMock, patch

from sqlmodel import select

from app.backend_pre_start import init, logger


async def test_init_successful_connection() -> None:
    engine_mock = MagicMock()

    session_mock = AsyncMock()
    session_cm = AsyncMock()
    session_cm.__aenter__.return_value = session_mock
    session_cm.__aexit__.return_value = None

    select1 = select(1)

    with (
        patch("app.backend_pre_start.async_session_maker", return_value=session_cm),
        patch("app.backend_pre_start.select", return_value=select1),
        patch.object(logger, "info"),
        patch.object(logger, "error"),
        patch.object(logger, "warn"),
    ):
        try:
            await init(engine_mock)
            connection_successful = True
        except Exception:
            connection_successful = False

        assert connection_successful, (
            "The database connection should be successful and not raise an exception."
        )

        session_mock.exec.assert_awaited_once_with(select1)
