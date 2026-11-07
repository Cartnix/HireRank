FROM python:3.14-slim-bookworm

ENV PYTHONUNBUFFERED=1

# Install curl
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl \
    && rm -rf /var/lib/apt/lists/*

# Install uv
COPY --from=ghcr.io/astral-sh/uv:0.9.26 /uv /uvx /bin/

# Compile bytecode
ENV UV_COMPILE_BYTECODE=1

# uv Cache
ENV UV_LINK_MODE=copy

WORKDIR /app/backend

# Place executables in the environment at the front of the path
ENV PATH="/app/backend/.venv/bin:$PATH"
ENV PYTHONPATH="/app/backend"

# Копируем конфиги зависимостей (относительно корня backend)
COPY pyproject.toml uv.lock alembic.ini ./

# Install dependencies
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev --no-install-project

# Копируем скрипты и сам код
COPY scripts ./scripts
COPY app ./app

# Sync the project
RUN --mount=type=cache,target=/root/.cache/uv \
    uv sync --frozen --no-dev

CMD ["sh", "-c", "bash scripts/prestart.sh && exec fastapi run app/main.py --host 0.0.0.0 --port ${PORT:-10000} --workers ${WEB_CONCURRENCY:-1}"]