# Service Results Backend API

A comprehensive backend API for managing service results (Palm Reading, Astrology, Vastu, Numerology, Tarot) with AI-powered summaries, semantic search, and intelligent context building.

## 🚀 Features

- **Service Result Management**: Save, retrieve, and manage service results
- **AI-Powered Summaries**: Automatically generate concise summaries using GPT-4o-mini
- **Semantic Search**: Find relevant results using OpenAI embeddings and cosine similarity
- **Smart Context Building**: Enhance AI conversations with relevant past readings
- **Result Attachments**: Attach results to chat messages
- **Caching Layer**: Redis-based caching for improved performance
- **Rate Limiting**: Protect API from abuse
- **Comprehensive Logging**: Winston-based logging system
- **Type Safety**: Full TypeScript implementation
- **Database Migrations**: Prisma ORM with PostgreSQL

## 📋 Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6.0
- OpenAI API Key

## 🛠️ Installation

1. **Clone and navigate to server directory**:
```bash
cd server
```

2. **Install dependencies**:
```bash
npm install
```

3. **Set up environment variables**:
```bash
cp .env.example .env
```

Edit `.env` and configure:
- Database URL (PostgreSQL)
- Redis connection
- OpenAI API key
- JWT secret

4. **Run database migrations**:
```bash
npm run migrate
```

5. **Generate Prisma client**:
```bash
npm run generate
```

## 🏃 Running the Server

### Development mode:
```bash
npm run dev
```

### Production mode:
```bash
npm run build
npm start
```

### Database studio:
```bash
npm run studio
```

## 📡 API Endpoints

### Authentication
All endpoints require Bearer token authentication:
```
Authorization: Bearer <your-jwt-token>
```

### Service Results

#### POST `/api/v1/service-results/save`
Save a new service result with AI-generated summary.

**Request Body**:
```json
{
  "conversationId": "uuid",
  "serviceType": "PALM|ASTROLOGY|VASTU|NUMEROLOGY|TAROT",
  "resultData": {
    // Service-specific result data
  },
  "attachmentPosition": 0
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "result-uuid",
    "serviceType": "PALM",
    "summary": "AI-generated summary...",
    "createdAt": "2024-01-01T00:00:00Z"
  },
  "message": "Service result saved successfully"
}
```

#### GET `/api/v1/service-results/user/:userId`
Get all results for a user.

**Query Parameters**:
- `serviceType` (optional): Filter by service type
- `limit` (optional): Number of results (default: 50)
- `offset` (optional): Pagination offset

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "serviceType": "PALM",
      "summary": "Summary...",
      "createdAt": "2024-01-01T00:00:00Z",
      "lastReferencedAt": null,
      "attachmentPosition": null,
      "conversationId": null
    }
  ],
  "count": 1
}
```

#### GET `/api/v1/service-results/:resultId`
Get a specific result by ID. Updates `lastReferencedAt` timestamp.

**Response**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "userId": "user-uuid",
    "serviceType": "PALM",
    "resultData": { /* full data */ },
    "summary": "Summary...",
    "createdAt": "2024-01-01T00:00:00Z",
    "lastReferencedAt": "2024-01-01T00:00:00Z"
  }
}
```

#### GET `/api/v1/service-results/conversation/:conversationId`
Get all results attached to a conversation.

**Response**:
```json
{
  "success": true,
  "data": [ /* array of results */ ],
  "count": 2
}
```

#### DELETE `/api/v1/service-results/:resultId`
Soft delete a result and remove from message attachments.

**Response**:
```json
{
  "success": true,
  "message": "Service result deleted successfully"
}
```

#### POST `/api/v1/service-results/search`
Semantic search for relevant results using AI embeddings.

**Request Body**:
```json
{
  "query": "Tell me about my palm reading",
  "limit": 3
}
```

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "serviceType": "PALM",
      "summary": "Summary...",
      "relevanceScore": 0.89,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "count": 1
}
```

#### POST `/api/v1/service-results/context`
Build enhanced AI context with relevant past readings.

**Request Body**:
```json
{
  "message": "What does my palm reading say about career?",
  "conversationId": "uuid"
}
```

**Response**:
```json
{
  "success": true,
  "data": {
    "context": "\n\n📚 AVAILABLE PAST READINGS:\n...",
    "relevantResults": [
      {
        "id": "uuid",
        "serviceType": "PALM",
        "summary": "Summary...",
        "relevanceScore": 0.92,
        "createdAt": "2024-01-01T00:00:00Z"
      }
    ]
  }
}
```

#### POST `/api/v1/service-results/:resultId/attach`
Attach a result to a chat message.

**Request Body**:
```json
{
  "messageId": "message-uuid"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Result attached to message successfully"
}
```

## 🧠 AI Features

### Summary Generation
Each service type has a customized prompt template for optimal summaries:
- **Palm Reading**: Focus on life line, heart line, and destiny
- **Astrology**: Planetary positions and house influences
- **Vastu**: Space energy and directional alignments
- **Numerology**: Life path, destiny, and soul urge numbers
- **Tarot**: Major cards, positions, and key messages

### Semantic Search
Uses OpenAI's `text-embedding-3-small` model to:
1. Generate embeddings for result summaries
2. Generate embeddings for user queries
3. Calculate cosine similarity
4. Rank results by relevance
5. Return top matches (threshold: 0.7)

### Smart Detection
Automatically detects:
- **Service Type**: Keywords like "palm", "chart", "vastu", etc.
- **Time References**: "last", "first", "recent", "yesterday"
- **Specific Mentions**: "my palm reading", "that tarot reading"

### Context Building
Enriches AI conversations with:
- Formatted past readings (max 3)
- Relevance-based selection
- Concise summaries (50 tokens each)
- Clear instructions for AI
- Result IDs for reference

## 💾 Database Schema

### Service Results Table
```sql
service_results (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  conversation_id UUID REFERENCES conversations(id),
  service_type ENUM,
  result_data JSONB,
  summary TEXT,
  attachment_position INTEGER,
  is_deleted BOOLEAN,
  created_at TIMESTAMP,
  last_referenced_at TIMESTAMP,
  updated_at TIMESTAMP
)
```

### Messages Table
```sql
messages (
  id UUID PRIMARY KEY,
  conversation_id UUID,
  content TEXT,
  role TEXT,
  has_attachments BOOLEAN,
  attached_result_ids JSONB,
  created_at TIMESTAMP
)
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | `development` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection | Required |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `JWT_SECRET` | JWT secret key | Required |
| `OPENAI_API_KEY` | OpenAI API key | Required |
| `OPENAI_MODEL` | AI model | `gpt-4o-mini` |
| `OPENAI_MAX_TOKENS` | Max tokens for summaries | `150` |
| `CACHE_TTL` | Cache TTL (seconds) | `86400` |

## 🧪 Testing

### Run tests:
```bash
npm test
```

### Watch mode:
```bash
npm run test:watch
```

### Example test cases:
- Save service result
- Generate summary
- Semantic search
- Context building
- Result attachment
- Soft delete

## 📊 Logging

Logs are stored in `logs/` directory:
- `combined.log`: All logs
- `error.log`: Error logs only
- `exceptions.log`: Uncaught exceptions
- `rejections.log`: Unhandled rejections

## 🚀 Deployment

### Using Docker:
```bash
docker-compose up -d
```

### Using PM2:
```bash
npm run build
pm2 start dist/index.js --name service-results-api
```

### Database Migration:
```bash
npm run migrate:deploy
```

## 🔒 Security

- **Helmet**: Security headers
- **CORS**: Configured origins
- **Rate Limiting**: 100 requests per 15 minutes
- **JWT Authentication**: Bearer token required
- **Input Validation**: Joi schemas
- **SQL Injection Protection**: Prisma parameterized queries

## 📈 Performance

- **Redis Caching**: 24-hour cache for summaries and embeddings
- **Database Indexing**: Optimized queries
- **Connection Pooling**: Prisma connection management
- **Lazy Loading**: On-demand embedding generation

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Open pull request

## 📝 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- GitHub Issues
- Documentation
- API Reference

## 🗺️ Roadmap

- [ ] WebSocket support for real-time updates
- [ ] PDF export functionality
- [ ] Result sharing between users
- [ ] Advanced analytics
- [ ] Multi-language support
- [ ] Voice input integration

---

Built with ❤️ using Node.js, TypeScript, PostgreSQL, Redis, and OpenAI

