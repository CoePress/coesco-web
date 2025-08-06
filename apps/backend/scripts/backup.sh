#!/bin/bash

TIMESTAMP=$(date +"%F")
DEST="/home/pi/backups/db"
FILENAME="$DEST/$TIMESTAMP.sql.gz"

mkdir -p "$DEST"
pg_dump -U youruser -h localhost yourdb | gzip > "$FILENAME"

# Delete backups older than 14 days
find "$DEST" -type f -name "*.sql.gz" -mtime +14 -delete

# TODO: Add to crontab on prod & update path
# 0 2 * * * /home/pi/scripts/backup.sh ()
