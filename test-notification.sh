#!/bin/bash

# Test notification endpoint
# Usage: ./test-notification.sh <your-jwt-token>

TOKEN="${1:-YOUR_TOKEN_HERE}"

echo "Testing notification endpoint..."
echo "Token: ${TOKEN:0:20}..."

curl -X POST http://localhost:3004/api/notifications/test \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -v

echo ""
echo "Done!"
