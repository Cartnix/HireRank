"""Destructive tests are confined to two new temporary databases."""

import os
import subprocess
import sys
import uuid

import psycopg
from psycopg import sql

from app.core.config import settings


def main() -> None:
    suffix = uuid.uuid4().hex[:12]
    primary, dev = f"hirerank_tools_{suffix}", f"hirerank_tools_dev_{suffix}"
    url = str(settings.SQLALCHEMY_DATABASE_URI).replace(
        "postgresql+psycopg:", "postgresql:"
    )
    with psycopg.connect(url, autocommit=True) as connection:
        for name in (primary, dev):
            connection.execute(
                sql.SQL("CREATE DATABASE {} TEMPLATE template0").format(
                    sql.Identifier(name)
                )
            )
    env = {
        **os.environ,
        "POSTGRES_DB": primary,
        "POSTGRES_DEV_DB": dev,
        "DEV_DATABASE_ENABLED": "true",
        "SQLALCHEMY_POOL_MODE": "null",
    }
    try:
        subprocess.run(["alembic", "upgrade", "head"], env=env, check=True)
        subprocess.run([sys.executable, "-m", "app.dev.bootstrap"], env=env, check=True)
        subprocess.run(
            [
                "pytest",
                "tests/core/test_superuser_access.py",
                "tests/api/routes/test_developer.py",
                "tests/api/routes/test_developer_tools.py",
                "-q",
            ],
            env=env,
            check=True,
        )
    finally:
        with psycopg.connect(url, autocommit=True) as connection:
            for name in (dev, primary):
                connection.execute(
                    sql.SQL("DROP DATABASE {} WITH (FORCE)").format(
                        sql.Identifier(name)
                    )
                )


if __name__ == "__main__":
    main()
