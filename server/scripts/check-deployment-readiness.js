/**
 * Deployment Readiness Checker
 * Verifies all deployment requirements are met
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

const checks = {
  passed: 0,
  failed: 0,
  warnings: 0,
};

function check(name, condition, warning = false) {
  if (condition) {
    checks.passed++;
    log(`  ✅ ${name}`, 'green');
  } else {
    if (warning) {
      checks.warnings++;
      log(`  ⚠️  ${name}`, 'yellow');
    } else {
      checks.failed++;
      log(`  ❌ ${name}`, 'red');
    }
  }
}

// Check environment variables
function checkEnvironmentVariables() {
  log('\n📋 ENVIRONMENT VARIABLES', 'blue');
  log('='.repeat(50), 'blue');

  const requiredEnvVars = [
    'DATABASE_URL',
    'JWT_SECRET',
    'AWS_ACCESS_KEY_ID',
    'AWS_SECRET_ACCESS_KEY',
    'AWS_REGION',
    'S3_BUCKET_NAME',
    'REDIS_URL',
  ];

  const envFile = path.join(__dirname, '../.env');
  const envExists = fs.existsSync(envFile);

  check('Environment file exists', envExists);

  if (envExists) {
    const envContent = fs.readFileSync(envFile, 'utf8');
    requiredEnvVars.forEach((varName) => {
      const hasVar = envContent.includes(varName) && !envContent.includes(`${varName}=`);
      check(`${varName} is set`, hasVar || process.env[varName], true);
    });
  } else {
    log('  ⚠️  Create .env file from .env.example', 'yellow');
  }
}

// Check build configuration
function checkBuildConfiguration() {
  log('\n🔧 BUILD CONFIGURATION', 'blue');
  log('='.repeat(50), 'blue');

  const packageJson = path.join(__dirname, '../package.json');
  const packageExists = fs.existsSync(packageJson);

  check('package.json exists', packageExists);

  if (packageExists) {
    const pkg = JSON.parse(fs.readFileSync(packageJson, 'utf8'));
    check('Build script exists', !!pkg.scripts?.build);
    check('Start script exists', !!pkg.scripts?.start);
    check('TypeScript configured', !!pkg.devDependencies?.typescript);
  }

  const tsconfig = path.join(__dirname, '../tsconfig.json');
  check('TypeScript config exists', fs.existsSync(tsconfig));
}

// Check mobile app configuration
function checkMobileAppConfig() {
  log('\n📱 MOBILE APP CONFIGURATION', 'blue');
  log('='.repeat(50), 'blue');

  const appJson = path.join(__dirname, '../../SmartCampusMobile/app.json');
  const appJsonExists = fs.existsSync(appJson);

  check('app.json exists', appJsonExists);

  if (appJsonExists) {
    const appConfig = JSON.parse(fs.readFileSync(appJson, 'utf8'));
    const expo = appConfig.expo || {};

    check('App name is set', !!expo.name);
    check('App version is set', !!expo.version);
    check('Bundle identifier (iOS) is set', !!expo.ios?.bundleIdentifier);
    check('Package name (Android) is set', !!expo.android?.package);
    check('Icon path is set', !!expo.icon);
    check('Splash screen is configured', !!expo.splash);

    // Check if icon files exist
    if (expo.icon) {
      const iconPath = path.join(__dirname, '../../SmartCampusMobile', expo.icon);
      check('App icon file exists', fs.existsSync(iconPath));
    }

    if (expo.splash?.image) {
      const splashPath = path.join(__dirname, '../../SmartCampusMobile', expo.splash.image);
      check('Splash screen file exists', fs.existsSync(splashPath));
    }

    if (expo.android?.adaptiveIcon?.foregroundImage) {
      const adaptiveIconPath = path.join(
        __dirname,
        '../../SmartCampusMobile',
        expo.android.adaptiveIcon.foregroundImage
      );
      check('Android adaptive icon exists', fs.existsSync(adaptiveIconPath));
    }
  }
}

// Check Google Maps API key
function checkGoogleMapsAPI() {
  log('\n🗺️  GOOGLE MAPS API', 'blue');
  log('='.repeat(50), 'blue');

  const mapsService = path.join(
    __dirname,
    '../../SmartCampusMobile/services/MapsService.ts'
  );
  const mapsServiceExists = fs.existsSync(mapsService);

  check('MapsService.ts exists', mapsServiceExists);

  if (mapsServiceExists) {
    const content = fs.readFileSync(mapsService, 'utf8');
    const hasPlaceholder =
      content.includes('YOUR_DEV_GOOGLE_MAPS_API_KEY') ||
      content.includes('YOUR_PROD_GOOGLE_MAPS_API_KEY');

    check(
      'Google Maps API key is configured',
      !hasPlaceholder,
      true // Warning, not critical for basic functionality
    );

    if (hasPlaceholder) {
      log('  ⚠️  Update MapsService.ts with your Google Maps API key', 'yellow');
    }
  }
}

// Check push notification setup
function checkPushNotifications() {
  log('\n🔔 PUSH NOTIFICATIONS', 'blue');
  log('='.repeat(50), 'blue');

  const appJson = path.join(__dirname, '../../SmartCampusMobile/app.json');
  if (fs.existsSync(appJson)) {
    const appConfig = JSON.parse(fs.readFileSync(appJson, 'utf8'));
    const plugins = appConfig.expo?.plugins || [];

    check(
      'expo-notifications plugin is configured',
      plugins.some((p) => p === 'expo-notifications' || p[0] === 'expo-notifications')
    );
  }

  // Check if notification service exists
  const notificationService = path.join(
    __dirname,
    '../../SmartCampusMobile/services/NotificationService.ts'
  );
  check('NotificationService exists', fs.existsSync(notificationService), true);

  // Check backend notification controller
  const notificationController = path.join(
    __dirname,
    '../src/controllers/notifications.controller.ts'
  );
  check('Backend notification controller exists', fs.existsSync(notificationController));
}

// Check API performance
async function checkAPIPerformance() {
  log('\n⚡ API PERFORMANCE', 'blue');
  log('='.repeat(50), 'blue');

  try {
    const response = await fetch('http://localhost:5000/health');
    if (response.ok) {
      const startTime = Date.now();
      await response.json();
      const duration = Date.now() - startTime;

      check('Health endpoint responds', true);
      check(`Health endpoint response time < 100ms`, duration < 100, true);
      log(`  Response time: ${duration}ms`, duration < 100 ? 'green' : 'yellow');
    } else {
      check('Health endpoint responds', false);
    }
  } catch (error) {
    check('Server is running', false);
    log('  ⚠️  Start the server with: cd server && npm run dev', 'yellow');
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
  check('Performance utilities exist', fs.existsSync(performanceUtils));

  if (fs.existsSync(performanceUtils)) {
    const content = fs.readFileSync(performanceUtils, 'utf8');
    check('Image compression implemented', content.includes('compressImage'));
    check('Image caching implemented', content.includes('ImageCache'));
    check('Thumbnail generation implemented', content.includes('generateThumbnail'));
  }
}

// Check list optimization
function checkListOptimization() {
  log('\n📜 LIST OPTIMIZATION', 'blue');
  log('='.repeat(50), 'blue');

  // Check if FlatList is used (better than ScrollView for lists)
  const screensDir = path.join(__dirname, '../../SmartCampusMobile/screens');
  if (fs.existsSync(screensDir)) {
    const screens = fs.readdirSync(screensDir).filter((f) => f.endsWith('.tsx'));
    let flatListCount = 0;
    let scrollViewCount = 0;

    screens.forEach((screen) => {
      const content = fs.readFileSync(path.join(screensDir, screen), 'utf8');
      if (content.includes('FlatList')) flatListCount++;
      if (content.includes('ScrollView')) scrollViewCount++;
    });

    check('FlatList is used in screens', flatListCount > 0);
    log(`  FlatList usage: ${flatListCount} screens`, 'cyan');
    log(`  ScrollView usage: ${scrollViewCount} screens`, 'cyan');
  }
}

// Main function
async function runChecks() {
  log('\n🚀 DEPLOYMENT READINESS CHECK', 'cyan');
  log('='.repeat(50), 'cyan');

  checkEnvironmentVariables();
  checkBuildConfiguration();
  checkMobileAppConfig();
  checkGoogleMapsAPI();
  checkPushNotifications();
  checkImageOptimization();
  checkListOptimization();
  await checkAPIPerformance();

  // Summary
  log('\n' + '='.repeat(50), 'cyan');
  log('📊 SUMMARY', 'cyan');
  log('='.repeat(50), 'cyan');
  log(`✅ Passed: ${checks.passed}`, 'green');
  log(`⚠️  Warnings: ${checks.warnings}`, 'yellow');
  log(`❌ Failed: ${checks.failed}`, checks.failed > 0 ? 'red' : 'green');

  const total = checks.passed + checks.warnings + checks.failed;
  const score = ((checks.passed / total) * 100).toFixed(1);
  log(`\n📈 Readiness Score: ${score}%`, score >= 80 ? 'green' : 'yellow');

  if (checks.failed > 0) {
    log('\n❌ Please fix the failed checks before deployment', 'red');
    process.exit(1);
  } else if (checks.warnings > 0) {
    log('\n⚠️  Review warnings before production deployment', 'yellow');
  } else {
    log('\n✅ All checks passed! Ready for deployment.', 'green');
  }
}

// Run checks
runChecks().catch((error) => {
  log(`\n❌ Error running checks: ${error.message}`, 'red');
  process.exit(1);
});

