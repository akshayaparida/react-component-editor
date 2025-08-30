#!/bin/bash

# Database backup script
# Usage: ./scripts/backup-db.sh [backup-name]

set -e

# Load environment variables
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Default backup name with timestamp
BACKUP_NAME=${1:-"backup_$(date +%Y%m%d_%H%M%S)"}
BACKUP_DIR="backups"
BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.sql"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "🔄 Creating database backup..."
echo "📁 Backup file: $BACKUP_FILE"

# Extract connection details from DATABASE_URL
DB_URL=${DATABASE_URL:-"postgresql://postgres:password@localhost:5432/react_component_editor"}

# Create backup using pg_dump
pg_dump "$DB_URL" > "$BACKUP_FILE"

# Create a metadata file with backup info
cat > "${BACKUP_DIR}/${BACKUP_NAME}.info" << EOF
{
  "backup_name": "$BACKUP_NAME",
  "created_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "database_url": "${DB_URL%/*}",
  "file_size": "$(du -h "$BACKUP_FILE" | cut -f1)",
  "tables_count": $(psql "$DB_URL" -t -c "SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';")
}
EOF

echo "✅ Backup completed successfully!"
echo "📊 File size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo "🗂️  Backup location: $BACKUP_FILE"
echo "📋 Metadata: ${BACKUP_DIR}/${BACKUP_NAME}.info"
