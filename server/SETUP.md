# Setup Instructions

Complete guide to set up the Service Results Backend API from scratch.

## 📋 Prerequisites

Before starting, ensure you have:

- **Node.js** v18+ installed ([Download](https://nodejs.org/))
- **PostgreSQL** v14+ installed ([Download](https://www.postgresql.org/download/))
- **Redis** v6+ installed ([Download](https://redis.io/download))
- **OpenAI API Key** ([Get one](https://platform.openai.com/api-keys))
- **Git** installed
- **npm** or **yarn** package manager

## 🚀 Step-by-Step Setup

### 1. Clone Repository

```bash
git clone <repository-url>
cd Smart-Campus/server
```

### 2. Install Dependencies

```bash
npm install
```

This will install all required packages including:
- Express.js (Web framework)
- Prisma (Database ORM)
- OpenAI SDK
- Redis client
- TypeScript and development tools

### 3. Setup PostgreSQL Database

#### Option A: Local PostgreSQL

```bash
# Start PostgreSQL service
# On macOS:
brew services start postgresql

# On Ubuntu:
sudo systemctl start postgresql

# Create database
createdb service_results_db

# Create database user (optional)
psql postgres
CREATE USER serviceresults WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE service_results_db TO serviceresults;
\q
```

#### Option B: Using Docker

```bash
docker run --name postgres \
  -e POSTGRES_USER=serviceresults \
  -e POSTGRES_PASSWORD=dev_password \
  -e POSTGRES_DB=service_results_db \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### 4. Setup Redis

#### Option A: Local Redis

```bash
# On macOS:
brew services start redis

# On Ubuntu:
sudo systemctl start redis

# Test connection
redis-cli ping
# Should return: PONG
```

#### Option B: Using Docker

```bash
docker run --name redis \
  -p 6379:6379 \
  -d redis:7-alpine
```

### 5. Configure Environment Variables

```bash
# Copy example environment file
cp .env.example .env

# Edit the file
nano .env  # or use your preferred editor
```

Update the following variables in `.env`:

```env
# Database
DATABASE_URL="postgresql://serviceresults:your_password@localhost:5432/service_results_db?schema=public"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-super-secret-key-minimum-32-characters-long

# OpenAI
OPENAI_API_KEY=sk-your-openai-api-key-here
```

### 6. Generate Prisma Client

```bash
npm run generate
```

This generates TypeScript types based on your schema.

### 7. Run Database Migrations

```bash
npm run migrate
```

This will:
- Create all database tables
- Set up indexes
- Configure foreign keys

You should see output like:
```
✅ Your database is now in sync with your schema.
```

### 8. Verify Setup

Test database connection:
```bash
npm run studio
```

This opens Prisma Studio at http://localhost:5555 where you can browse your database.

### 9. Start Development Server

```bash
npm run dev
```

The server should start on http://localhost:5000

You should see:
```
🚀 Server running on port 5000 in development mode
📡 API available at http://localhost:5000/api/v1
💚 Health check at http://localhost:5000/health
```

### 10. Test the API

```bash
# Health check
curl http://localhost:5000/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 10.5,
  "environment": "development"
}
```

## 🧪 Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm test -- --coverage
```

## 📦 Alternative: Quick Start with Docker Compose

For the fastest setup, use Docker Compose which handles everything:

```bash
# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Stop all services
docker-compose down
```

This will start:
- PostgreSQL on port 5432
- Redis on port 6379
- API server on port 5000

## 🔧 Additional Configuration

### Setup OpenAI API Key

1. Go to [OpenAI Platform](https://platform.openai.com/)
2. Create an account or login
3. Navigate to API Keys section
4. Create a new API key
5. Copy and add to `.env` file

### Configure CORS

By default, CORS is set to `*` (all origins). For production:

```env
CORS_ORIGIN=https://yourdomain.com,https://app.yourdomain.com
```

### Adjust Rate Limiting

Default: 100 requests per 15 minutes

```env
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX_REQUESTS=100
```

### Configure Logging

```env
LOG_LEVEL=info  # debug, info, warn, error
LOG_FILE_PATH=logs/app.log
```

## 🐛 Troubleshooting

### Issue: Cannot connect to PostgreSQL

**Solution**:
```bash
# Check if PostgreSQL is running
pg_isready

# Check connection string
psql "postgresql://serviceresults:password@localhost:5432/service_results_db"
```

### Issue: Cannot connect to Redis

**Solution**:
```bash
# Check if Redis is running
redis-cli ping

# Should return: PONG
```

### Issue: Prisma migration fails

**Solution**:
```bash
# Reset database (WARNING: Deletes all data)
npm run migrate:reset

# Try migration again
npm run migrate
```

### Issue: OpenAI API errors

**Solution**:
- Verify API key is correct
- Check OpenAI account has credits
- Ensure no rate limiting from OpenAI

### Issue: Port 5000 already in use

**Solution**:
```bash
# Change port in .env
PORT=5001

# Or kill process using port 5000
lsof -ti:5000 | xargs kill -9
```

## 📚 Next Steps

1. **Read the API Documentation**: See `README.md` for all endpoints
2. **Test Endpoints**: Use Postman or curl to test API calls
3. **Implement Authentication**: Add JWT token generation
4. **Connect Frontend**: Integrate with your frontend application
5. **Deploy**: Follow `DEPLOYMENT.md` for production deployment

## 🆘 Getting Help

If you encounter issues:

1. Check logs: `logs/error.log` and `logs/combined.log`
2. Review environment variables
3. Verify all services are running
4. Check GitHub issues
5. Contact support team

## ✅ Verification Checklist

- [ ] Node.js v18+ installed
- [ ] PostgreSQL running and accessible
- [ ] Redis running and accessible
- [ ] Environment variables configured
- [ ] Dependencies installed
- [ ] Prisma client generated
- [ ] Database migrations completed
- [ ] Development server starts successfully
- [ ] Health check endpoint responds
- [ ] Tests pass successfully

---

**You're all set! 🎉**

The Service Results Backend API is now ready for development.

