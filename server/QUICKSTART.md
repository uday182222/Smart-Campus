# 🚀 Quick Start Guide

Get the Service Results API running in under 5 minutes!

## Prerequisites

- Node.js 18+ installed
- PostgreSQL running
- Redis running
- OpenAI API key

## 1. Install Dependencies

```bash
cd /Users/udaytomar/Developer/Smart-Campus/server
npm install
```

## 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and set **minimum required** values:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/service_results_db"
OPENAI_API_KEY="sk-your-key-here"
JWT_SECRET="your-secret-key-at-least-32-characters-long"
```

## 3. Setup Database

```bash
# Generate Prisma client
npm run generate

# Run migrations
npm run migrate
```

## 4. Start Server

```bash
npm run dev
```

Expected output:
```
✅ Database connection established
✅ Redis connection established
🚀 Server running on port 5000 in development mode
📡 API available at http://localhost:5000/api/v1
💚 Health check at http://localhost:5000/health
```

## 5. Test It Works

```bash
curl http://localhost:5000/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 5.2,
  "environment": "development"
}
```

## ✅ You're Ready!

The API is now running and ready to accept requests.

### Next Steps:

1. **Generate JWT Token** for testing:
```bash
# You'll need to create a user first or use your existing auth system
```

2. **Test Save Endpoint**:
```bash
curl -X POST http://localhost:5000/api/v1/service-results/save \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "PALM",
    "resultData": {
      "lifeLine": "strong",
      "heartLine": "clear"
    }
  }'
```

3. **View Documentation**:
- API Reference: `README.md`
- Full Examples: `API_EXAMPLES.md`
- Setup Guide: `SETUP.md`

## 🐳 Docker Quick Start

Even faster with Docker:

```bash
docker-compose up -d
```

That's it! PostgreSQL, Redis, and API all running.

## 🆘 Troubleshooting

### Database Connection Error
```bash
# Check PostgreSQL is running
pg_isready

# Or start with Homebrew
brew services start postgresql
```

### Redis Connection Error
```bash
# Check Redis is running
redis-cli ping

# Or start with Homebrew
brew services start redis
```

### Port Already in Use
```bash
# Change port in .env
PORT=5001
```

## 📚 Important Files

- **Environment**: `.env`
- **Schema**: `prisma/schema.prisma`
- **Logs**: `logs/combined.log`
- **API Docs**: `README.md`

## 🎉 Success!

Your Service Results API is now running locally and ready for development!

