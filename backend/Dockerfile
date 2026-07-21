FROM python:3.13-slim-bookworm

ENV PYTHONUNBUFFERED=1

# Install uv
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#installing-uv
COPY --from=ghcr.io/astral-sh/uv:0.9.26 /uv /uvx /bin/

# Compile bytecode
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#compiling-bytecode
ENV UV_COMPILE_BYTECODE=1

# uv Cache
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#caching
ENV UV_LINK_MODE=copy

WORKDIR /app/backend

# Place executables in the environment at the front of the path
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#using-the-environment
ENV PATH="/app/backend/.venv/bin:$PATH"
ENV PYTHONPATH="/app/backend"


COPY ./backend/pyproject.toml ./backend/uv.lock ./backend/alembic.ini ./

# Install dependencies
# Ref: https://docs.astral.sh/uv/guides/integration/docker/#intermediate-layers
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync

COPY ./backend/scripts ./scripts

COPY ./backend/app ./app

# Sync the project
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync


CMD ["fastapi", "run", "--workers", "4"]
