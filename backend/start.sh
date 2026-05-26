#!/bin/bash

# Wait for database to be ready
echo "Waiting for database connection..."
MAX_RETRIES=30
RETRY_COUNT=0

until alembic upgrade head || [ $RETRY_COUNT -eq $MAX_RETRIES ]; do
  echo "Database is not ready yet ($RETRY_COUNT/$MAX_RETRIES) - sleeping"
  let RETRY_COUNT=RETRY_COUNT+1
  sleep 2
done

if [ $RETRY_COUNT -eq $MAX_RETRIES ]; then
  echo "Error: Could not connect to database after $MAX_RETRIES attempts."
  exit 1
fi

echo "Database is ready - starting initial subjects seed..."
python seed_subjects.py

echo "Starting uvicorn server..."
# Start the application
uvicorn app.main:app --host 0.0.0.0 --port 8000
