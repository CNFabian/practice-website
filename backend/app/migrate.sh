#!/usr/bin/env bash

# Exit on any error
set -e

echo "Waiting for PostgreSQL to start..."

# Wait for the PostgreSQL database to be ready
while ! pg_isready -h db -p 5432 -U admin; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "PostgreSQL is ready!"

# Check if this is the first time running migrations
if [ ! -d "alembic/versions" ] || [ -z "$(ls -A alembic/versions 2>/dev/null)" ]; then
    echo "No existing migrations found. Creating initial migration..."
    python -m alembic revision --autogenerate -m "Initial migration"
fi

echo "Running migrations..."
python -m alembic upgrade head

echo "Migrations completed successfully!"
