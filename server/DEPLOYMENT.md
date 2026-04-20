# Deployment Guide

## Quick Start with Docker

### Development
```bash
# Start all services (PostgreSQL, Redis, API)
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down
```

### Production
```bash
# Build production image
docker build -t service-results-api:latest .

# Run with production environment
docker-compose -f docker-compose.prod.yml up -d
```

## Manual Deployment

### 1. Prerequisites
- Node.js 18+
- PostgreSQL 14+
- Redis 6+
- PM2 (for process management)

### 2. Setup Database

```bash
# Create database
createdb service_results_db

# Run migrations
npm run migrate:deploy
```

### 3. Configure Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with production values
nano .env
```

**Required Environment Variables**:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_HOST`: Redis host
- `OPENAI_API_KEY`: OpenAI API key
- `JWT_SECRET`: Secure random string

### 4. Build and Start

```bash
# Install dependencies
npm ci --production

# Generate Prisma client
npm run generate

# Build TypeScript
npm run build

# Start with PM2
pm2 start dist/index.js --name service-results-api

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

## AWS Deployment

### Using EC2

1. **Launch EC2 Instance**:
   - AMI: Ubuntu 22.04 LTS
   - Instance Type: t3.medium or higher
   - Security Group: Allow ports 5000, 22, 5432, 6379

2. **Install Dependencies**:
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install PM2
sudo npm install -g pm2
```

3. **Setup Application**:
```bash
# Clone repository
git clone <your-repo-url>
cd server

# Install and build
npm ci
npm run build

# Setup database
npm run migrate:deploy

# Start with PM2
pm2 start dist/index.js --name api
pm2 startup
pm2 save
```

4. **Configure Nginx (Optional)**:
```nginx
server {
    listen 80;
    server_name api.yourdomain.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Using RDS and ElastiCache

1. **RDS PostgreSQL**:
   - Create RDS instance
   - Copy endpoint URL
   - Update `DATABASE_URL` in `.env`

2. **ElastiCache Redis**:
   - Create ElastiCache cluster
   - Copy endpoint URL
   - Update `REDIS_HOST` and `REDIS_PORT` in `.env`

### Using ECS (Docker)

1. **Build and Push Docker Image**:
```bash
# Build image
docker build -t service-results-api:latest .

# Tag for ECR
docker tag service-results-api:latest <account-id>.dkr.ecr.<region>.amazonaws.com/service-results-api:latest

# Push to ECR
docker push <account-id>.dkr.ecr.<region>.amazonaws.com/service-results-api:latest
```

2. **Create ECS Task Definition**:
```json
{
  "family": "service-results-api",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "<your-ecr-image>",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "NODE_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:..."
        }
      ]
    }
  ]
}
```

## Monitoring

### Health Checks

```bash
# API health
curl http://localhost:5000/health

# Database connection
npm run migrate:status

# Redis connection
redis-cli ping
```

### Logs

```bash
# PM2 logs
pm2 logs api

# Application logs
tail -f logs/combined.log
tail -f logs/error.log

# Docker logs
docker-compose logs -f api
```

### Metrics

Setup monitoring with:
- **CloudWatch**: AWS metrics
- **Datadog**: Application monitoring
- **Sentry**: Error tracking
- **New Relic**: APM

## Scaling

### Horizontal Scaling

```bash
# Start multiple instances with PM2
pm2 start dist/index.js -i max --name api

# Or use docker-compose
docker-compose up -d --scale api=3
```

### Load Balancing

Use:
- **AWS ALB**: Application Load Balancer
- **Nginx**: Reverse proxy with load balancing
- **HAProxy**: High-performance load balancer

### Database Scaling

- **Read Replicas**: For read-heavy workloads
- **Connection Pooling**: Prisma handles this automatically
- **Caching**: Redis reduces database load

## Backup & Recovery

### Database Backups

```bash
# Manual backup
pg_dump service_results_db > backup_$(date +%Y%m%d).sql

# Restore
psql service_results_db < backup_20240101.sql

# Automated backups (cron)
0 2 * * * pg_dump service_results_db > /backups/backup_$(date +\%Y\%m\%d).sql
```

### Redis Backups

```bash
# Manual backup
redis-cli SAVE

# Copy RDB file
cp /var/lib/redis/dump.rdb /backups/redis_$(date +%Y%m%d).rdb
```

## Security Checklist

- [ ] Use strong `JWT_SECRET`
- [ ] Enable HTTPS/TLS
- [ ] Configure firewall rules
- [ ] Use environment variables for secrets
- [ ] Enable rate limiting
- [ ] Setup CORS properly
- [ ] Use AWS Secrets Manager or similar
- [ ] Enable database encryption
- [ ] Setup VPC for database access
- [ ] Regular security updates
- [ ] Monitor access logs

## Troubleshooting

### Database Connection Issues
```bash
# Test connection
psql $DATABASE_URL

# Check Prisma
npm run migrate:status
```

### Redis Connection Issues
```bash
# Test Redis
redis-cli -h $REDIS_HOST ping

# Check configuration
redis-cli CONFIG GET *
```

### High Memory Usage
```bash
# Check Node.js memory
pm2 monit

# Increase memory limit
pm2 start dist/index.js --max-memory-restart 500M
```

### Slow API Response
- Check Redis cache hit rate
- Monitor database query performance
- Review OpenAI API latency
- Enable query logging

## Rollback Procedure

```bash
# Stop application
pm2 stop api

# Rollback database
npm run migrate:reset

# Deploy previous version
git checkout <previous-tag>
npm ci
npm run build

# Start application
pm2 start dist/index.js --name api
```

## Support

For deployment issues:
1. Check logs: `logs/error.log`
2. Review configuration
3. Test health endpoints
4. Contact support team

