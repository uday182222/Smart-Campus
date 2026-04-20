# API Examples

Complete examples for testing all endpoints with curl and JavaScript.

## Authentication

All requests require a Bearer token:
```bash
TOKEN="your-jwt-token-here"
```

## 1. Save Service Result

### Palm Reading
```bash
curl -X POST http://localhost:5000/api/v1/service-results/save \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "PALM",
    "resultData": {
      "lifeLine": {
        "length": "long",
        "depth": "deep",
        "interpretation": "Strong vitality and long life"
      },
      "heartLine": {
        "position": "high",
        "curve": "gentle",
        "interpretation": "Emotional balance and stable relationships"
      },
      "headLine": {
        "length": "medium",
        "curve": "straight",
        "interpretation": "Practical and logical thinking"
      }
    },
    "conversationId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

### Astrology
```bash
curl -X POST http://localhost:5000/api/v1/service-results/save \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "ASTROLOGY",
    "resultData": {
      "sunSign": "Aries",
      "moonSign": "Cancer",
      "ascendant": "Leo",
      "planets": {
        "venus": {
          "house": 7,
          "sign": "Libra",
          "interpretation": "Strong relationships and partnerships"
        },
        "mars": {
          "house": 10,
          "sign": "Capricorn",
          "interpretation": "Career-driven and ambitious"
        }
      }
    }
  }'
```

### Vastu
```bash
curl -X POST http://localhost:5000/api/v1/service-results/save \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "VASTU",
    "resultData": {
      "overallScore": 78,
      "rooms": {
        "bedroom": {
          "direction": "Southwest",
          "score": 85,
          "recommendations": ["Place bed in southwest corner", "Use earth tones"]
        },
        "kitchen": {
          "direction": "Southeast",
          "score": 90,
          "recommendations": ["Perfect placement", "Maintain cleanliness"]
        }
      }
    }
  }'
```

### Numerology
```bash
curl -X POST http://localhost:5000/api/v1/service-results/save \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "NUMEROLOGY",
    "resultData": {
      "lifePathNumber": 7,
      "destinyNumber": 11,
      "soulUrgeNumber": 3,
      "luckyNumbers": [7, 11, 3, 21, 30],
      "interpretations": {
        "lifePath": "Spiritual seeker and deep thinker",
        "destiny": "Master number - spiritual enlightenment",
        "soulUrge": "Creative expression and communication"
      }
    }
  }'
```

### Tarot
```bash
curl -X POST http://localhost:5000/api/v1/service-results/save \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "serviceType": "TAROT",
    "resultData": {
      "spread": "ThreeCard",
      "cards": [
        {
          "position": "past",
          "card": "The Fool",
          "upright": true,
          "interpretation": "New beginnings and spontaneity"
        },
        {
          "position": "present",
          "card": "The Magician",
          "upright": true,
          "interpretation": "Manifestation and power"
        },
        {
          "position": "future",
          "card": "The World",
          "upright": true,
          "interpretation": "Completion and success"
        }
      ]
    }
  }'
```

## 2. Get User Results

```bash
# Get all results for a user
curl -X GET "http://localhost:5000/api/v1/service-results/user/USER_ID" \
  -H "Authorization: Bearer $TOKEN"

# Filter by service type
curl -X GET "http://localhost:5000/api/v1/service-results/user/USER_ID?serviceType=PALM" \
  -H "Authorization: Bearer $TOKEN"

# Pagination
curl -X GET "http://localhost:5000/api/v1/service-results/user/USER_ID?limit=10&offset=0" \
  -H "Authorization: Bearer $TOKEN"
```

## 3. Get Specific Result

```bash
curl -X GET http://localhost:5000/api/v1/service-results/RESULT_ID \
  -H "Authorization: Bearer $TOKEN"
```

## 4. Get Conversation Results

```bash
curl -X GET http://localhost:5000/api/v1/service-results/conversation/CONVERSATION_ID \
  -H "Authorization: Bearer $TOKEN"
```

## 5. Semantic Search

```bash
# Search for relevant results
curl -X POST http://localhost:5000/api/v1/service-results/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Tell me about my palm reading and what it says about career",
    "limit": 3
  }'

# Search with service type detection
curl -X POST http://localhost:5000/api/v1/service-results/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "What does my birth chart say about relationships?"
  }'

# Search with time reference
curl -X POST http://localhost:5000/api/v1/service-results/search \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Show me my last tarot reading"
  }'
```

## 6. Build AI Context

```bash
curl -X POST http://localhost:5000/api/v1/service-results/context \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What career path should I consider based on my readings?",
    "conversationId": "550e8400-e29b-41d4-a716-446655440000"
  }'
```

## 7. Attach Result to Message

```bash
curl -X POST http://localhost:5000/api/v1/service-results/RESULT_ID/attach \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "messageId": "650e8400-e29b-41d4-a716-446655440000"
  }'
```

## 8. Delete Result

```bash
curl -X DELETE http://localhost:5000/api/v1/service-results/RESULT_ID \
  -H "Authorization: Bearer $TOKEN"
```

## JavaScript/TypeScript Examples

### Using Fetch API

```typescript
// Save result
async function saveServiceResult(data: any) {
  const response = await fetch('http://localhost:5000/api/v1/service-results/save', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
  
  return await response.json();
}

// Search results
async function searchResults(query: string) {
  const response = await fetch('http://localhost:5000/api/v1/service-results/search', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, limit: 3 }),
  });
  
  return await response.json();
}

// Get user results
async function getUserResults(userId: string) {
  const response = await fetch(
    `http://localhost:5000/api/v1/service-results/user/${userId}`,
    {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    }
  );
  
  return await response.json();
}

// Build context
async function buildContext(message: string, conversationId: string) {
  const response = await fetch('http://localhost:5000/api/v1/service-results/context', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, conversationId }),
  });
  
  return await response.json();
}
```

### Using Axios

```typescript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1',
  headers: {
    'Authorization': `Bearer ${token}`,
  },
});

// Save result
const saveResult = async (data: any) => {
  const response = await api.post('/service-results/save', data);
  return response.data;
};

// Search
const searchResults = async (query: string, limit = 3) => {
  const response = await api.post('/service-results/search', { query, limit });
  return response.data;
};

// Get results
const getUserResults = async (userId: string, filters?: any) => {
  const response = await api.get(`/service-results/user/${userId}`, {
    params: filters,
  });
  return response.data;
};
```

## React Hook Example

```typescript
import { useState, useEffect } from 'react';

function useServiceResults(userId: string) {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchResults() {
      try {
        const response = await fetch(
          `http://localhost:5000/api/v1/service-results/user/${userId}`,
          {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        );
        const data = await response.json();
        setResults(data.data);
      } catch (err) {
        setError(err);
      } finally {
        setLoading(false);
      }
    }

    fetchResults();
  }, [userId]);

  return { results, loading, error };
}

// Usage
function ResultsList() {
  const { results, loading, error } = useServiceResults('user-123');
  
  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  
  return (
    <div>
      {results.map(result => (
        <div key={result.id}>
          <h3>{result.serviceType}</h3>
          <p>{result.summary}</p>
        </div>
      ))}
    </div>
  );
}
```

## Response Examples

### Successful Save Response
```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "serviceType": "PALM",
    "summary": "Your palm reading reveals a strong life line indicating longevity and vitality. The heart line shows emotional balance with a gentle curve suggesting stable relationships.",
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "message": "Service result saved successfully"
}
```

### Search Response
```json
{
  "success": true,
  "data": [
    {
      "id": "result-1",
      "serviceType": "PALM",
      "summary": "Strong life line and clear heart line...",
      "relevanceScore": 0.92,
      "createdAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "result-2",
      "serviceType": "ASTROLOGY",
      "summary": "Venus in 10th house indicates career success...",
      "relevanceScore": 0.87,
      "createdAt": "2024-01-10T15:20:00.000Z"
    }
  ],
  "count": 2
}
```

### Context Response
```json
{
  "success": true,
  "data": {
    "context": "\n\n📚 AVAILABLE PAST READINGS:\n1. PALM READING (5 days ago) [ID: result-1]\n   Strong life line and clear heart line indicate longevity...\n\n2. ASTROLOGY READING (10 days ago) [ID: result-2]\n   Venus in 10th house shows career-oriented energy...\n",
    "relevantResults": [
      {
        "id": "result-1",
        "serviceType": "PALM",
        "summary": "Strong life line...",
        "relevanceScore": 0.92,
        "createdAt": "2024-01-15T10:30:00.000Z"
      }
    ]
  }
}
```

### Error Response
```json
{
  "success": false,
  "error": {
    "message": "Service result not found"
  }
}
```

## Testing Tips

1. **Use Postman**: Import the collection for easy testing
2. **Check Logs**: Monitor `logs/combined.log` for debugging
3. **Test Authentication**: Ensure valid JWT tokens
4. **Rate Limiting**: Be aware of 100 requests per 15 minutes
5. **Error Handling**: Test with invalid data to verify validation

## Common Issues

### 401 Unauthorized
- Check if token is valid
- Ensure Bearer prefix is included
- Verify JWT_SECRET matches

### 400 Bad Request
- Validate request body structure
- Check required fields
- Verify enum values (service types)

### 404 Not Found
- Verify result ID exists
- Check user ownership
- Ensure result not deleted

### 500 Internal Server Error
- Check server logs
- Verify database connection
- Ensure OpenAI API key is valid

