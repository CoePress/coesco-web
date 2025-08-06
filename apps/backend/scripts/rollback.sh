#!/bin/bash
LATEST=$(ls -t /home/pi/backups/db/*.sql.gz | head -n 1)
gunzip -c "$LATEST" | psql -U youruser -h localhost yourdb
