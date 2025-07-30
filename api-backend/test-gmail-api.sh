#!/bin/bash

echo "🧪 Gmail API Testing Script"
echo "=========================="

BASE_URL="https://zigsaw-backend.vercel.app"

echo ""
echo "1. Testing authentication status..."
curl -s "$BASE_URL/api/auth/session" | jq .

echo ""
echo "2. Testing Gmail tokens..."
curl -s "$BASE_URL/api/gmail/tokens" | jq .

echo ""
echo "3. Testing labels..."
curl -s "$BASE_URL/api/gmail/list-labels" | jq '.common'

echo ""
echo "4. Testing recent emails..."
curl -s "$BASE_URL/api/gmail/list-emails?maxResults=3" | jq '.messages[0:2]'

echo ""
echo "✅ Basic tests complete!"
echo "💡 For full testing, sign in first: $BASE_URL/api/auth/signin/google"
