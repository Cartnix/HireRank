#! /usr/bin/env bash

set -e
set -x

# Let the DB start
python app/backend_pre_start.py

cd backend

# Run migrations
alembic -c alembic.ini upgrade head

# Create initial data in DB
python app/initial_data.py
