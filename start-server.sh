#!/bin/bash

# Start Smart Campus Server
# Usage: ./start-server.sh

cd "$(dirname "$0")/server"

echo "🚀 Starting Smart Campus Server..."
echo ""

# Check if port is already in use
if lsof -ti:5000 > /dev/null 2>&1; then
  echo "⚠️  Port 5000 is already in use"
  echo "   Server might already be running"
  echo "   Check: curl http://localhost:5000/health"
  exit 1
fi

# Start server
npm run dev > /tmp/smart-campus-server.log 2>&1 &
SERVER_PID=$!

echo "✅ Server starting... PID: $SERVER_PID"
echo "📝 Logs: /tmp/smart-campus-server.log"
echo ""
echo "Waiting for server to be ready..."

# Wait for server to start
for i in {1..15}; do
  if curl -s http://localhost:5000/health > /dev/null 2>&1; then
    echo "✅ Server is running on http://localhost:5000"
    echo ""
    echo "🧪 Test endpoints:"
    echo "   Health: curl http://localhost:5000/health"
    echo "   Login: curl -X POST http://localhost:5000/api/v1/auth/login \\"
    echo "     -H 'Content-Type: application/json' \\"
    echo "     -d '{\"email\":\"teacher@test.com\",\"password\":\"test123\"}'"
    echo ""
    echo "📋 To stop server: kill $SERVER_PID"
    exit 0
  fi
  sleep 1
done

echo "❌ Server failed to start. Check logs:"
tail -20 /tmp/smart-campus-server.log
exit 1

