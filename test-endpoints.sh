#!/bin/bash

echo "Testing Azure service principal endpoints..."

# Test role-check endpoint (should return 401 without proper auth)
echo "1. Testing role-check endpoint:"
curl -i -X GET "http://localhost:5000/api/azure/credentials/1/role-check"
echo -e "\n"

# Test token validation endpoint (should return 401 without proper auth)
echo "2. Testing token validation endpoint:"
curl -i -X POST "http://localhost:5000/api/azure/token/validate" \
  -H "Content-Type: application/json" \
  -d '{"accessToken": "test"}'
echo -e "\n"

# Test assign role endpoint (should return 401 without proper auth)
echo "3. Testing assign role endpoint:"
curl -i -X POST "http://localhost:5000/api/azure/credentials/1/assign-contributor-role" \
  -H "Content-Type: application/json" \
  -d '{"accessToken": "test"}'
echo -e "\n"

echo "Test completed. If all endpoints return 401 (Unauthorized), they exist and are protected correctly."
