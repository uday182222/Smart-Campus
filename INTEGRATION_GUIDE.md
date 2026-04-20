# 🚀 Integration Guide - Service Results System

Complete guide for integrating the service results system into your application.

## Quick Integration Steps

### 1. Backend Setup (5 minutes)

```bash
cd /Users/udaytomar/Developer/Smart-Campus/server

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your credentials:
# - DATABASE_URL (PostgreSQL)
# - REDIS_HOST and REDIS_PORT
# - OPENAI_API_KEY
# - JWT_SECRET

# Setup database
npm run generate
npm run migrate

# Start backend
npm run dev
```

Backend will be available at: `http://localhost:5000`

### 2. Frontend Integration (5 minutes)

```bash
cd /Users/udaytomar/Developer/Smart-Campus/SmartCampusMobile

# Install new dependencies
npm install @react-native-async-storage/async-storage expo-linear-gradient socket.io-client
```

### 3. Import Components

```typescript
// In your main chat/conversation screen
import ServiceResultsAPI from './services/ServiceResultsAPI';
import AIContextService from './services/AIContextService';
import WebSocketService from './services/WebSocketService';
import useServiceResults from './hooks/useServiceResults';

// Components
import ServiceResultCard from './components/ServiceResultCard';
import ChatAttachment from './components/ChatAttachment';
import ResultsSidebar from './components/ResultsSidebar';
import FullResultModal from './components/FullResultModal';
import AIReferenceIndicator from './components/AIReferenceIndicator';
import OnboardingTooltip from './components/OnboardingTooltip';

// Services
import ServiceIntegration from './services/ServiceIntegration';
import AccessibilityHelper from './utils/accessibility';
```

---

## Component Usage Examples

### 1. Display Service Result Card

```typescript
import ServiceResultCard from './components/ServiceResultCard';

function MyScreen() {
  const { results } = useServiceResults();

  return (
    <FlatList
      data={results}
      renderItem={({ item }) => (
        <ServiceResultCard
          result={item}
          variant="expanded"
          onPress={() => openFullModal(item)}
          onAskAbout={() => askAIAbout(item)}
          isNew={isLessThan24Hours(item.createdAt)}
        />
      )}
    />
  );
}
```

### 2. Show Chat Attachments

```typescript
import ChatAttachment from './components/ChatAttachment';

function ChatMessage({ message }) {
  const attachedResults = message.attachedResults || [];

  return (
    <View>
      <Text>{message.content}</Text>
      {attachedResults.length > 0 && (
        <ChatAttachment
          results={attachedResults}
          onViewFull={(result) => openFullModal(result)}
          onAskAbout={(result) => fillMessageInput(`Tell me more about my ${result.serviceType}`)}
          onRemove={(id) => removeAttachment(id)}
        />
      )}
    </View>
  );
}
```

### 3. Results Sidebar

```typescript
import ResultsSidebar from './components/ResultsSidebar';

function ChatScreen() {
  const [sidebarVisible, setSidebarVisible] = useState(false);

  return (
    <>
      {/* Toggle button */}
      <TouchableOpacity onPress={() => setSidebarVisible(true)}>
        <MaterialIcons name="menu-book" size={24} />
      </TouchableOpacity>

      {/* Sidebar */}
      <ResultsSidebar
        visible={sidebarVisible}
        onClose={() => setSidebarVisible(false)}
        onResultSelect={(result) => openFullModal(result)}
        onAskAbout={(result) => {
          setSidebarVisible(false);
          askAIAbout(result);
        }}
      />
    </>
  );
}
```

### 4. Full Result Modal

```typescript
import FullResultModal from './components/FullResultModal';

function MyApp() {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedResult, setSelectedResult] = useState(null);

  return (
    <>
      <FullResultModal
        visible={modalVisible}
        result={selectedResult}
        onClose={() => setModalVisible(false)}
        onAskAbout={() => {
          setModalVisible(false);
          askAIAbout(selectedResult);
        }}
        onAttachToChat={() => {
          attachToCurrentConversation(selectedResult.id);
          setModalVisible(false);
        }}
      />
    </>
  );
}
```

### 5. AI Context Integration

```typescript
import AIContextService from './services/AIContextService';

async function sendMessageToAI(userMessage: string) {
  // Check if we should fetch context
  if (AIContextService.shouldFetchContext(userMessage)) {
    // Build enhanced context
    const context = await AIContextService.buildEnhancedContext(
      userMessage,
      currentConversationId
    );

    // Send to AI with context
    const aiResponse = await sendToAI({
      message: userMessage,
      systemPrompt: context.systemPrompt,
      relevantResults: context.relevantResults,
    });

    // Show AI reference indicators if results were referenced
    if (context.relevantResults.length > 0) {
      displayAIReferences(context.relevantResults);
    }

    return aiResponse;
  }

  // Normal AI call without context
  return await sendToAI({ message: userMessage });
}
```

### 6. Service Handler Integration

```typescript
import ServiceIntegration from './services/ServiceIntegration';

// Palm Reading Service
async function completePalmReading(analysisData: any) {
  const resultId = await ServiceIntegration.handlePalmReading(
    analysisData,
    currentConversationId,
    (id) => {
      // On saved callback
      showToast('✅ Palm reading saved!');
    },
    (id) => {
      // On attached callback
      showToast('📎 Attached to chat');
    }
  );

  // Show the result
  showInlineResult(resultId);
}

// Astrology Service
async function completeAstrology(chartData: any) {
  const resultId = await ServiceIntegration.handleAstrology(
    chartData,
    currentConversationId,
    (id) => showToast('✅ Birth chart saved!'),
    (id) => showToast('📎 Attached to chat')
  );
}

// Similar for Vastu, Numerology, Tarot...
```

### 7. WebSocket Setup

```typescript
import WebSocketService from './services/WebSocketService';

// In your app initialization
useEffect(() => {
  const initWebSocket = async () => {
    const token = await AsyncStorage.getItem('authToken');
    const userId = await AsyncStorage.getItem('userId');
    
    WebSocketService.connect(userId, token);

    // Listen for events
    const unsubscribe1 = WebSocketService.on('service_result_saved', (result) => {
      console.log('New result saved:', result);
      showToast(`${result.serviceType} reading saved!`);
    });

    const unsubscribe2 = WebSocketService.on('ai_referenced_result', (data) => {
      console.log('AI referenced result:', data.resultId);
      highlightResult(data.resultId);
    });

    return () => {
      unsubscribe1();
      unsubscribe2();
      WebSocketService.disconnect();
    };
  };

  initWebSocket();
}, []);
```

### 8. Optimistic Updates

```typescript
import useServiceResults from './hooks/useServiceResults';

function MyComponent() {
  const { results, saveResult, deleteResult, loading } = useServiceResults({
    enableRealtime: true,
  });

  const handleSave = async () => {
    try {
      // Optimistic update - result appears immediately
      const result = await saveResult({
        serviceType: ServiceType.PALM,
        resultData: palmData,
        conversationId: currentConversationId,
      });
      
      showToast('Saved successfully!');
    } catch (error) {
      // Automatically rolled back on error
      showToast('Failed to save');
    }
  };

  const handleDelete = async (resultId: string) => {
    try {
      // Optimistic update - result removed immediately
      await deleteResult(resultId);
      showToast('Deleted successfully!');
    } catch (error) {
      // Automatically rolled back on error
      showToast('Failed to delete');
    }
  };

  return (
    <FlatList
      data={results}
      refreshing={loading}
      onRefresh={() => refresh()}
      renderItem={({ item }) => (
        <ServiceResultCard result={item} />
      )}
    />
  );
}
```

### 9. Onboarding Tooltips

```typescript
import OnboardingTooltip, { TooltipManager } from './components/OnboardingTooltip';

function MyApp() {
  // Register tooltips
  useEffect(() => {
    TooltipManager.registerTooltips([
      {
        id: 'first-result',
        title: 'Reading Saved!',
        message: 'Your reading is now saved. View it anytime from the sidebar.',
      },
      {
        id: 'sidebar-highlight',
        title: 'All Your Readings',
        message: 'Access all your past readings here. Tap to open.',
      },
      {
        id: 'ask-ai',
        title: 'Ask AI',
        message: 'Try asking AI about your result. Example: "What does my palm reading say about career?"',
      },
    ]);
  }, []);

  return (
    <>
      {/* Show tooltip after first result */}
      <OnboardingTooltip
        id="first-result"
        title="Reading Saved!"
        message="Your reading is now saved. View it anytime from the sidebar."
        onDismiss={() => console.log('Tooltip dismissed')}
      />
    </>
  );
}
```

### 10. Accessibility

```typescript
import AccessibilityHelper from './utils/accessibility';

function ServiceResultCard({ result }) {
  const accessibilityProps = AccessibilityHelper.getResultCardAccessibility(
    result.serviceType,
    result.summary,
    result.createdAt,
    isNew,
    isReferenced
  );

  return (
    <TouchableOpacity {...accessibilityProps}>
      {/* Card content */}
    </TouchableOpacity>
  );
}

// Announce events
function handleResultSaved(serviceType: string) {
  AccessibilityHelper.announceResultSaved(serviceType);
}

function handleError(message: string) {
  AccessibilityHelper.announceError(message);
}
```

---

## API Usage Examples

### Save Result

```typescript
const result = await ServiceResultsAPI.saveResult({
  serviceType: ServiceType.PALM,
  resultData: {
    lifeLine: { length: 'long', interpretation: '...' },
    heartLine: { position: 'high', interpretation: '...' },
  },
  conversationId: 'conversation-123',
});

console.log('Saved result:', result.id);
console.log('AI Summary:', result.summary);
```

### Search Results

```typescript
const results = await ServiceResultsAPI.searchResults(
  'Tell me about my palm reading and career',
  3
);

results.forEach(r => {
  console.log(`${r.serviceType}: ${r.relevanceScore}`);
});
```

### Build Context

```typescript
const context = await AIContextService.buildEnhancedContext(
  'What does my chart say about relationships?',
  conversationId
);

// Use context.systemPrompt in your AI call
const aiResponse = await callAI({
  userMessage: message,
  systemPrompt: context.systemPrompt,
});
```

---

## Environment Variables

### Backend `.env`

```env
# Core
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/service_results_db"

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key-min-32-chars

# OpenAI
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini
OPENAI_MAX_TOKENS=150

# CORS
CORS_ORIGIN=http://localhost:3000,http://localhost:19006

# Cache
SUMMARY_CACHE_TTL=86400
```

### Frontend Configuration

```typescript
// In ServiceResultsAPI.ts
const API_BASE_URL = __DEV__ 
  ? 'http://localhost:5000/api/v1' 
  : 'https://your-production-api.com/api/v1';

// Update with your production URL
```

---

## Testing

### Backend

```bash
cd server
npm test
```

### Frontend

```bash
cd SmartCampusMobile

# Unit tests
npm test

# E2E tests (if configured)
npm run test:e2e
```

---

## Common Issues & Solutions

### Issue 1: Backend Connection Error
```typescript
// Check if backend is running
curl http://localhost:5000/health

// Solution: Start backend
cd server && npm run dev
```

### Issue 2: WebSocket Not Connecting
```typescript
// Check WebSocket connection
WebSocketService.isConnected() // Should return true

// Solution: Verify token and userId
const token = await AsyncStorage.getItem('authToken');
const userId = await AsyncStorage.getItem('userId');
console.log('Token:', token, 'UserId:', userId);
```

### Issue 3: Summaries Not Generating
```bash
# Check OpenAI API key
echo $OPENAI_API_KEY

# Check logs
tail -f server/logs/error.log
```

---

## Performance Optimization

### 1. Enable Result Caching

Results are automatically cached. Clear cache if needed:

```typescript
// Clear specific cache
await ServiceResultsAPI.clearCache('result-id');

// Refresh all results
const { refresh } = useServiceResults();
await refresh();
```

### 2. Lazy Loading

```typescript
function ResultsList() {
  const [page, setPage] = useState(0);
  const limit = 20;

  const loadMore = async () => {
    const moreResults = await ServiceResultsAPI.getUserResults({
      limit,
      offset: page * limit,
    });
    setResults(prev => [...prev, ...moreResults]);
    setPage(p => p + 1);
  };

  return (
    <FlatList
      data={results}
      onEndReached={loadMore}
      onEndReachedThreshold={0.5}
    />
  );
}
```

### 3. Virtual Scrolling

Already implemented in `ResultsSidebar` component with `FlatList`.

---

## Deployment Checklist

- [ ] Backend deployed and accessible
- [ ] Database migrations run
- [ ] Redis configured
- [ ] OpenAI API key set
- [ ] JWT secret configured
- [ ] Frontend API URL updated
- [ ] WebSocket URL updated
- [ ] Environment variables set
- [ ] SSL certificates configured
- [ ] Monitoring enabled
- [ ] Backup strategy in place

---

## Support & Resources

### Documentation
- **Backend API**: `server/README.md`
- **Setup Guide**: `server/SETUP.md`
- **Deployment**: `server/DEPLOYMENT.md`
- **Examples**: `server/API_EXAMPLES.md`

### Health Checks
- Backend: `http://localhost:5000/health`
- Database: `npm run migrate:status`
- Redis: `redis-cli ping`

### Logs
- Backend: `server/logs/combined.log`
- Errors: `server/logs/error.log`

---

## 🎉 You're All Set!

Your service results system is now fully integrated and ready to use!

**Key Features Available**:
- ✅ AI-powered summaries
- ✅ Semantic search
- ✅ Real-time updates
- ✅ Beautiful UI components
- ✅ Mobile optimized
- ✅ Accessible
- ✅ Production ready

**Need Help?**
- Check documentation in `/server/` directory
- Review code examples in this guide
- Check logs for errors
- Test with provided API examples

Happy coding! 🚀

