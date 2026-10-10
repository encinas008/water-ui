#!/bin/sh
set -e

# Si API_URL no esta definida, usa el valor por defecto del build.
: "${API_URL:=http://localhost:8085/api}"

envsubst '${API_URL}' \
  < /usr/share/nginx/html/config.json.template \
  > /usr/share/nginx/html/config.json

echo "[runtime-config] config.json generado -> apiUrl=${API_URL}"
