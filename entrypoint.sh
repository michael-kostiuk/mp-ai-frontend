#!/bin/sh

# Set defaults if not provided
VITE_API_URL=${VITE_API_URL:-"http://localhost:8000"}
VITE_URL=${VITE_URL:-"http://localhost:8000"}

# Create config.js with the environment variables
echo "window._env_ = {" > /usr/share/nginx/html/config.js
echo "  VITE_API_URL: \"$VITE_API_URL\"," >> /usr/share/nginx/html/config.js
echo "  VITE_URL: \"$VITE_URL\"" >> /usr/share/nginx/html/config.js
echo "};" >> /usr/share/nginx/html/config.js

echo "Generated config.js with VITE_API_URL=$VITE_API_URL"

# Start nginx
exec nginx -g "daemon off;"
