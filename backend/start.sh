#!/bin/bash

# Wait for database to be ready
echo "Waiting for database..."
until alembic upgrade head; do
  echo "Database is not ready yet - sleeping"
  sleep 2
done

echo "Database is ready - starting app"

# Start the application
uvicorn app.main:app --host 0.0.0.0 --port 8000
