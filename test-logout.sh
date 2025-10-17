#!/bin/bash

# Admin Logout Test Script

API_URL="http://localhost:3001/api"
USERNAME="Art1204"
PASSWORD="Art@1204"

echo "🔧 Admin Logout Test"
echo "===================="
echo ""

# Step 1: Sign In
echo "1️⃣  Signing in as admin..."
LOGIN_RESPONSE=$(curl -s -X POST "$API_URL/auth/admin/signin" \
  -H "Content-Type: application/json" \
  -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGIN_RESPONSE"
echo ""

# Extract token
TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)
USER_ID=$(echo "$LOGIN_RESPONSE" | jq -r '.user.id' 2>/dev/null)

if [ -z "$TOKEN" ] || [ "$TOKEN" = "null" ]; then
  echo "❌ Login failed - no token received"
  exit 1
fi

echo "✅ Login successful"
echo "Token: $TOKEN"
echo "User ID: $USER_ID"
echo ""

# Step 2: Sign Out
echo "2️⃣  Signing out..."
LOGOUT_RESPONSE=$(curl -s -X POST "$API_URL/auth/admin/signout" \
  -H "Content-Type: application/json" \
  -d "{\"token\":\"$TOKEN\",\"userId\":\"$USER_ID\"}")

echo "Logout Response:"
echo "$LOGOUT_RESPONSE" | jq '.' 2>/dev/null || echo "$LOGOUT_RESPONSE"
echo ""

# Check if logout was successful
if echo "$LOGOUT_RESPONSE" | jq -e '.success == true' >/dev/null 2>&1; then
  echo "✅ Logout successful"
else
  echo "⚠️  Logout response unclear"
fi

echo ""
echo "✨ Test completed!"
