"""Provision a temporary isolated DB for dev/auth integration verification."""

import os
import subprocess
import uuid

import psycopg
from psycopg import sql

from app.core.config import settings


def main() -> None:
    name = f"hirerank_verify_{uuid.uuid4().hex[:12]}"
    url = str(settings.SQLALCHEMY_DATABASE_URI).replace(
        "postgresql+psycopg:", "postgresql:"
    )
    with psycopg.connect(url, autocommit=True) as connection:
        connection.execute(
            sql.SQL("CREATE DATABASE {} TEMPLATE {}").format(
                sql.Identifier(name), sql.Identifier("template0")
            )
        )
    env = {
        **os.environ,
        "POSTGRES_DB": name,
        "DEV_DATABASE_ENABLED": "true",
        "SQLALCHEMY_POOL_MODE": "null",
    }
    try:
        subprocess.run(["alembic", "upgrade", "head"], env=env, check=True)
        subprocess.run(
            [
                "pytest",
                "tests/api/routes/test_overview.py",
                "tests/api/routes/test_dashboard_analytics.py",
                "tests/core/test_superuser_access.py",
                "tests/api/routes/test_developer.py",
                "-q",
            ],
            env=env,
            check=True,
        )
    finally:
        with psycopg.connect(url, autocommit=True) as connection:
            connection.execute(
                sql.SQL("DROP DATABASE {} WITH (FORCE)").format(sql.Identifier(name))
            )


if __name__ == "__main__":
    main()
