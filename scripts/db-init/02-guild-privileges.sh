#!/bin/sh
set -eu

if [ -z "${MARIADB_DATABASE:-}" ] || [ -z "${MARIADB_USER:-}" ] || [ -z "${MARIADB_ROOT_PASSWORD:-}" ]; then
  echo "[db-init] Skipping guild privilege grants because required MariaDB env vars are missing."
  exit 0
fi

guild_db_pattern="$(printf '%s\\_guild\\_%%' "$MARIADB_DATABASE")"

mariadb -uroot -p"${MARIADB_ROOT_PASSWORD}" <<SQL
GRANT CREATE ON *.* TO '${MARIADB_USER}'@'%';
GRANT ALL PRIVILEGES ON \`${guild_db_pattern}\`.* TO '${MARIADB_USER}'@'%';
FLUSH PRIVILEGES;
SQL

echo "[db-init] Granted CREATE and guild database privileges to ${MARIADB_USER}."
