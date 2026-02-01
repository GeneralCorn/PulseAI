#!/bin/bash

echo "=== Supabase Migration Runner ==="
echo "This will apply all migrations to your Supabase database"
echo ""

# Get the database URL from Supabase dashboard
echo "Please enter your Supabase database connection string"
echo "(Find it in: Settings > Database > Connection string > URI)"
echo "Format: postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST]:5432/postgres"
read -p "Database URL: " DB_URL

if [ -z "$DB_URL" ]; then
  echo "Error: Database URL is required"
  exit 1
fi

echo ""
echo "Running migrations..."
psql "$DB_URL" -f apply-migrations.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migrations applied successfully!"
else
  echo ""
  echo "❌ Migration failed. Please check the errors above."
  exit 1
fi
