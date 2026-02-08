#!/bin/bash
set -e

echo "=========================================="
echo "⚠️  RDS DATABASE CLEANUP - ONE TIME ONLY"
echo "=========================================="

# Safety checks
if [ -z "$DB_CLEANUP_TOKEN" ]; then
    echo "❌ ERROR: DB_CLEANUP_TOKEN not set"
    echo "   Set DB_CLEANUP_TOKEN=CLEANUP_RDS_2026 to proceed"
    exit 1
fi

if [ "$DB_CLEANUP_TOKEN" != "CLEANUP_RDS_2026" ]; then
    echo "❌ ERROR: Invalid DB_CLEANUP_TOKEN"
    echo "   Expected: CLEANUP_RDS_2026"
    echo "   Got: $DB_CLEANUP_TOKEN"
    exit 1
fi

echo "✅ Cleanup token verified"
echo "📊 Target: $POSTGRES_HOST/$POSTGRES_DB"
echo ""

# Additional safety check for production
if [ "$ENVIRONMENT" = "production" ]; then
    if [ "$FORCE_PRODUCTION_CLEANUP" != "yes_i_am_sure" ]; then
        echo "❌ ERROR: Production database cleanup requires FORCE_PRODUCTION_CLEANUP=yes_i_am_sure"
        exit 1
    fi
    echo "⚠️  Production cleanup authorized"
fi

echo "🗑️  Dropping all tables and starting fresh..."
echo ""

# Drop all tables including alembic_version
PGPASSWORD=$POSTGRES_PASSWORD psql -h $POSTGRES_HOST -U $POSTGRES_USER -d $POSTGRES_DB <<'EOF'
-- Drop all tables in public schema
DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Drop all tables
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'DROP TABLE IF EXISTS ' || quote_ident(r.tablename) || ' CASCADE';
        RAISE NOTICE 'Dropped table: %', r.tablename;
    END LOOP;
    
    -- Drop all sequences
    FOR r IN (SELECT sequence_name FROM information_schema.sequences WHERE sequence_schema = 'public') LOOP
        EXECUTE 'DROP SEQUENCE IF EXISTS ' || quote_ident(r.sequence_name) || ' CASCADE';
        RAISE NOTICE 'Dropped sequence: %', r.sequence_name;
    END LOOP;
    
    -- Drop all ENUM types
    FOR r IN (SELECT t.typname FROM pg_type t 
              JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace 
              WHERE t.typtype = 'e' AND n.nspname = 'public') LOOP
        EXECUTE 'DROP TYPE IF EXISTS ' || quote_ident(r.typname) || ' CASCADE';
        RAISE NOTICE 'Dropped ENUM type: %', r.typname;
    END LOOP;
END $$;

-- Verify cleanup
SELECT 
    (SELECT COUNT(*) FROM pg_tables WHERE schemaname = 'public') as remaining_tables,
    (SELECT COUNT(*) FROM information_schema.sequences WHERE sequence_schema = 'public') as remaining_sequences,
    (SELECT COUNT(*) FROM pg_type t 
     JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace 
     WHERE t.typtype = 'e' AND n.nspname = 'public') as remaining_enums;
EOF

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Database cleanup complete!"
    echo "   All tables, sequences, and ENUM types have been dropped."
    echo "   You can now run: alembic upgrade head"
    echo ""
    echo "⚠️  IMPORTANT: Remove DB_CLEANUP_TOKEN and RUN_DB_CLEANUP from CircleCI"
    echo "   to prevent this from running again."
else
    echo ""
    echo "❌ Database cleanup failed!"
    exit 1
fi
