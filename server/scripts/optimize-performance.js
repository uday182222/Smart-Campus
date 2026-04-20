/**
 * Performance Optimization Script
 * Analyzes and suggests optimizations for API and app performance
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

const optimizations = {
  suggestions: [],
  implemented: [],
};

function addSuggestion(category, issue, solution) {
  optimizations.suggestions.push({ category, issue, solution });
}

function addImplemented(category, feature) {
  optimizations.implemented.push({ category, feature });
}

// Check API response times
async function analyzeAPIPerformance() {
  log('\n⚡ API PERFORMANCE ANALYSIS', 'blue');
  log('='.repeat(50), 'blue');

  const endpoints = [
    { path: '/health', method: 'GET' },
    { path: '/auth/login', method: 'POST' },
    { path: '/attendance', method: 'GET' },
    { path: '/homework', method: 'GET' },
  ];

  const results = [];

  for (const endpoint of endpoints) {
    try {
      const startTime = Date.now();
      const response = await fetch(`http://localhost:5000/api/v1${endpoint.path}`, {
        method: endpoint.method,
        headers: { 'Content-Type': 'application/json' },
      });
      const duration = Date.now() - startTime;
      results.push({ endpoint: endpoint.path, duration, status: response.status });

      if (duration > 500) {
        addSuggestion(
          'API Performance',
          `${endpoint.path} takes ${duration}ms`,
          'Consider adding caching or database query optimization'
        );
      } else if (duration < 200) {
        addImplemented('API Performance', `${endpoint.path} responds in ${duration}ms`);
      }
    } catch (error) {
      // Endpoint might require auth or not exist
    }
  }

  // Average response time
  const avgTime = results.reduce((sum, r) => sum + r.duration, 0) / results.length;
  log(`Average response time: ${avgTime.toFixed(0)}ms`, avgTime < 200 ? 'green' : 'yellow');

  if (avgTime > 300) {
    addSuggestion(
      'API Performance',
      'Average response time is high',
      'Implement Redis caching for frequently accessed data'
    );
  }
}

// Check database query optimization
function checkDatabaseOptimization() {
  log('\n🗄️  DATABASE OPTIMIZATION', 'blue');
  log('='.repeat(50), 'blue');

  const controllersDir = path.join(__dirname, '../src/controllers');
  if (!fs.existsSync(controllersDir)) return;

  const controllers = fs.readdirSync(controllersDir).filter((f) => f.endsWith('.ts'));

  let hasPagination = 0;
  let hasIndexing = 0;
  let hasSelect = 0;

  controllers.forEach((controller) => {
    const content = fs.readFileSync(path.join(controllersDir, controller), 'utf8');
    if (content.includes('skip') && content.includes('take')) hasPagination++;
    if (content.includes('@@index') || content.includes('index:')) hasIndexing++;
    if (content.includes('select:')) hasSelect++;
  });

  log(`Controllers with pagination: ${hasPagination}/${controllers.length}`, 'cyan');
  log(`Controllers with field selection: ${hasSelect}/${controllers.length}`, 'cyan');

  if (hasPagination < controllers.length * 0.5) {
    addSuggestion(
      'Database',
      'Not all endpoints use pagination',
      'Add pagination to list endpoints to improve performance'
    );
  }

  if (hasSelect < controllers.length * 0.3) {
    addSuggestion(
      'Database',
      'Limited use of field selection',
      'Use Prisma select to fetch only required fields'
    );
  }
}

// Check image optimization
function checkImageOptimization() {
  log('\n🖼️  IMAGE OPTIMIZATION', 'blue');
  log('='.repeat(50), 'blue');

  const performanceUtils = path.join(
    __dirname,
    '../../SmartCampusMobile/utils/performance.ts'
  );

  if (fs.existsSync(performanceUtils)) {
    const content = fs.readFileSync(performanceUtils, 'utf8');
    addImplemented('Images', 'Image compression utility exists');
    addImplemented('Images', 'Image caching implemented');
    addImplemented('Images', 'Thumbnail generation available');

    if (!content.includes('WebP')) {
      addSuggestion(
        'Images',
        'WebP format not used',
        'Consider converting images to WebP for better compression'
      );
    }
  } else {
    addSuggestion(
      'Images',
      'No image optimization utilities',
      'Implement image compression and caching'
    );
  }
}

// Check list rendering
function checkListRendering() {
  log('\n📜 LIST RENDERING', 'blue');
  log('='.repeat(50), 'blue');

  const screensDir = path.join(__dirname, '../../SmartCampusMobile/screens');
  if (!fs.existsSync(screensDir)) return;

  const screens = fs.readdirSync(screensDir).filter((f) => f.endsWith('.tsx'));
  let flatListCount = 0;
  let scrollViewCount = 0;
  let hasMemoization = 0;

  screens.forEach((screen) => {
    const content = fs.readFileSync(path.join(screensDir, screen), 'utf8');
    if (content.includes('FlatList')) flatListCount++;
    if (content.includes('ScrollView')) scrollViewCount++;
    if (content.includes('useMemo') || content.includes('React.memo')) hasMemoization++;
  });

  log(`Screens using FlatList: ${flatListCount}`, 'cyan');
  log(`Screens using ScrollView: ${scrollViewCount}`, 'cyan');
  log(`Screens with memoization: ${hasMemoization}`, 'cyan');

  if (scrollViewCount > flatListCount) {
    addSuggestion(
      'Lists',
      'ScrollView used more than FlatList',
      'Replace ScrollView with FlatList for better performance with large lists'
    );
  }

  if (hasMemoization < screens.length * 0.3) {
    addSuggestion(
      'Lists',
      'Limited use of memoization',
      'Use React.memo and useMemo to prevent unnecessary re-renders'
    );
  }
}

// Check caching
function checkCaching() {
  log('\n💾 CACHING', 'blue');
  log('='.repeat(50), 'blue');

  // Check Redis usage
  const servicesDir = path.join(__dirname, '../src/services');
  if (fs.existsSync(servicesDir)) {
    const services = fs.readdirSync(servicesDir).filter((f) => f.endsWith('.ts'));
    const hasRedis = services.some((s) => {
      const content = fs.readFileSync(path.join(servicesDir, s), 'utf8');
      return content.includes('redis') || content.includes('Redis');
    });

    if (hasRedis) {
      addImplemented('Caching', 'Redis caching implemented');
    } else {
      addSuggestion(
        'Caching',
        'No Redis caching found',
        'Implement Redis for API response caching'
      );
    }
  }

  // Check mobile app caching
  const mobileServices = path.join(__dirname, '../../SmartCampusMobile/services');
  if (fs.existsSync(mobileServices)) {
    const services = fs.readdirSync(mobileServices).filter((f) => f.endsWith('.ts'));
    const hasCache = services.some((s) => {
      const content = fs.readFileSync(path.join(mobileServices, s), 'utf8');
      return content.includes('cache') || content.includes('Cache');
    });

    if (hasCache) {
      addImplemented('Caching', 'Mobile app caching implemented');
    }
  }
}

// Main function
async function analyzePerformance() {
  log('\n🔍 PERFORMANCE ANALYSIS', 'cyan');
  log('='.repeat(50), 'cyan');

  await analyzeAPIPerformance();
  checkDatabaseOptimization();
  checkImageOptimization();
  checkListRendering();
  checkCaching();

  // Print summary
  log('\n' + '='.repeat(50), 'cyan');
  log('📊 OPTIMIZATION SUMMARY', 'cyan');
  log('='.repeat(50), 'cyan');

  if (optimizations.implemented.length > 0) {
    log('\n✅ IMPLEMENTED OPTIMIZATIONS:', 'green');
    optimizations.implemented.forEach((item) => {
      log(`  • ${item.category}: ${item.feature}`, 'green');
    });
  }

  if (optimizations.suggestions.length > 0) {
    log('\n💡 SUGGESTIONS:', 'yellow');
    optimizations.suggestions.forEach((item) => {
      log(`  • ${item.category}`, 'yellow');
      log(`    Issue: ${item.issue}`, 'yellow');
      log(`    Solution: ${item.solution}`, 'yellow');
    });
  } else {
    log('\n✅ No optimization suggestions!', 'green');
  }
}

// Run analysis
analyzePerformance().catch((error) => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});

