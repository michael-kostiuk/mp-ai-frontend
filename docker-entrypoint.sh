#!/bin/sh
set -e

# Generate runtime config for the frontend using container environment.
API_URL=${VITE_API_URL:-http://localhost:8000}

cat >/usr/share/nginx/html/env-config.js <<EOF
window.__MP_RUNTIME_CONFIG__ = {
  apiBaseUrl: "${API_URL}"
};
EOF

exec "$@"
