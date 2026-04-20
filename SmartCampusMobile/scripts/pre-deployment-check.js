#!/usr/bin/env node

/**
 * Pre-Deployment Check Script
 * Verifies all requirements before app deployment
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Load environment variables from .env for local/dev runs
try {
  // eslint-disable-next-line global-require
  const dotenv = require('dotenv');
  const envPath = path.join(__dirname, '..', '.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
} catch (e) {
  // If dotenv is not available, continue – CI/EAS may inject env vars differently
}

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

// Check results
const results = {
  passed: [],
  failed: [],
  warnings: [],
};

// Helper functions
function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, colors.green);
  results.passed.push(message);
}

function fail(message) {
  log(`❌ ${message}`, colors.red);
  results.failed.push(message);
}

function warn(message) {
  log(`⚠️  ${message}`, colors.yellow);
  results.warnings.push(message);
}

function info(message) {
  log(`ℹ️  ${message}`, colors.cyan);
}

function header(message) {
  log(`\n${message}`, colors.blue);
  log('='.repeat(60), colors.blue);
}

// Check functions

/**
 * Check 1: Environment Variables
 */
async function checkEnvironmentVariables() {
  header('1. Checking Environment Variables');

  const requiredEnvVars = [
    'EXPO_PUBLIC_API_URL',
  ];

  const optionalEnvVars = [
    'EXPO_PUBLIC_GOOGLE_MAPS_API_KEY',
    'EXPO_PUBLIC_AWS_REGION',
    'EXPO_PUBLIC_AWS_COGNITO_USER_POOL_ID',
    'EXPO_PUBLIC_AWS_COGNITO_CLIENT_ID',
    'EXPO_PUBLIC_SENTRY_DSN',
    'EXPO_PUBLIC_ANALYTICS_ID',
  ];

  let allSet = true;

  // Check required
  requiredEnvVars.forEach((varName) => {
    if (process.env[varName]) {
      success(`${varName}: Set`);
    } else {
      fail(`${varName}: Not set`);
      allSet = false;
    }
  });

  // Check optional
  optionalEnvVars.forEach((varName) => {
    if (process.env[varName]) {
      info(`${varName}: Set`);
    } else {
      warn(`${varName}: Not set (optional)`);
    }
  });

  if (allSet) {
    success('Environment variables: All required variables set');
  } else {
    fail('Environment variables: Missing required variables');
  }
}

/**
 * Check 2: API Endpoint Reachability
 */
async function checkAPIEndpoint() {
  header('2. Checking API Endpoint');

  const apiUrl = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:5000';

  try {
    const startTime = Date.now();
    await new Promise((resolve, reject) => {
      const url = new URL(`${apiUrl}/api/v1/health`);
      const client = url.protocol === 'https:' ? https : http;

      const req = client.get(url, (res) => {
        const chunks = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const endTime = Date.now();
          const responseTime = endTime - startTime;

          if (res.statusCode === 200) {
            success(`API connection: Reachable (${responseTime}ms)`);
            resolve(true);
          } else {
            fail(`API connection: HTTP ${res.statusCode}`);
            reject(new Error(`HTTP ${res.statusCode}`));
          }
        });
      });

      req.on('error', (error) => {
        fail(`API connection: ${error.message}`);
        reject(error);
      });

      req.setTimeout(5000, () => {
        fail('API connection: Timeout after 5s');
        req.destroy();
        reject(new Error('Timeout'));
      });
    });
  } catch (error) {
    fail(`API connection: ${error.message}`);
  }
}

/**
 * Check 3: AWS Cognito
 */
async function checkAWSCognito() {
  header('3. Checking AWS Cognito');

  const region = process.env.EXPO_PUBLIC_AWS_REGION;
  const userPoolId = process.env.EXPO_PUBLIC_AWS_COGNITO_USER_POOL_ID;
  const clientId = process.env.EXPO_PUBLIC_AWS_COGNITO_CLIENT_ID;

  if (!region || !userPoolId || !clientId) {
    warn('AWS Cognito: Configuration missing (optional for local dev, required for production)');
    return;
  }

  // Basic validation of format
  if (userPoolId.startsWith('eu-') || userPoolId.startsWith('us-')) {
    success('AWS Cognito: Configuration appears valid');
  } else {
    warn('AWS Cognito: User Pool ID format looks unusual');
  }

  info(`Region: ${region}`);
  info(`User Pool ID: ${userPoolId.substring(0, 20)}...`);
}

/**
 * Check 4: AWS S3
 */
async function checkAWSS3() {
  header('4. Checking AWS S3');

  const region = process.env.EXPO_PUBLIC_AWS_REGION;
  const bucketName = process.env.EXPO_PUBLIC_S3_BUCKET_NAME;

  if (!region) {
    warn('AWS S3: Region not set, using default');
  }

  if (!bucketName) {
    warn('AWS S3: Bucket name not configured (optional for mobile)');
  } else {
    success('AWS S3: Bucket configured');
    info(`Bucket: ${bucketName}`);
  }
}

/**
 * Check 5: Google Maps API
 */
async function checkGoogleMapsAPI() {
  header('5. Checking Google Maps API');

  const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!apiKey) {
    warn('Google Maps API: Key not set (optional, required only if maps are used in production)');
    return;
  }

  if (apiKey.length < 30) {
    fail('Google Maps API: Key format invalid (too short)');
    return;
  }

  if (apiKey.startsWith('AIza')) {
    success('Google Maps API: Key format valid');
  } else {
    warn('Google Maps API: Key format looks unusual');
  }

  // Note: We can't validate the key without making an API call
  info('Note: Key validity will be checked on first map load');
}

/**
 * Check 6: Push Notification Setup
 */
async function checkPushNotifications() {
  header('6. Checking Push Notification Setup');

  try {
    const appJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../app.json'), 'utf8')
    );

    const hasNotifications = appJson.expo?.plugins?.some(
      (plugin) => plugin === 'expo-notifications' || plugin[0] === 'expo-notifications'
    );

    if (hasNotifications) {
      success('Push notifications: Plugin configured');
    } else {
      warn('Push notifications: Plugin not found in app.json');
    }

    // Check for EAS project ID
    const hasEasProjectId = appJson.expo?.extra?.eas?.projectId;
    if (hasEasProjectId) {
      success('Push notifications: EAS project ID set');
    } else {
      warn('Push notifications: EAS project ID not set');
    }

    // Check for iOS push configuration
    if (appJson.expo?.ios?.infoPlist?.UIBackgroundModes?.includes('remote-notification')) {
      success('Push notifications: iOS background mode configured');
    } else {
      warn('Push notifications: iOS background mode not configured');
    }

    // Check for Android push configuration
    if (appJson.expo?.android?.googleServicesFile) {
      success('Push notifications: Android google-services.json configured');
    } else {
      warn('Push notifications: Android google-services.json not set');
    }
  } catch (error) {
    fail(`Push notifications: Error reading app.json - ${error.message}`);
  }
}

/**
 * Check 7: App Icons
 */
async function checkAppIcons() {
  header('7. Checking App Icons');

  const requiredIcons = [
    { path: 'assets/icon.png', name: 'App Icon', minSize: 1024 },
    { path: 'assets/adaptive-icon.png', name: 'Adaptive Icon (Android)', minSize: 1024 },
    { path: 'assets/splash-icon.png', name: 'Splash Icon', minSize: 512, optional: true },
  ];

  requiredIcons.forEach((icon) => {
    const iconPath = path.join(__dirname, '..', icon.path);

    if (fs.existsSync(iconPath)) {
      const stats = fs.statSync(iconPath);
      const sizeMB = (stats.size / (1024 * 1024)).toFixed(2);

      if (stats.size > 10 * 1024) {
        // At least 10KB
        success(`${icon.name}: Present (${sizeMB}MB)`);
      } else {
        warn(`${icon.name}: File too small (${sizeMB}MB)`);
      }
    } else if (icon.optional) {
      warn(`${icon.name}: Not found (optional)`);
    } else {
      fail(`${icon.name}: Not found at ${icon.path}`);
    }
  });
}

/**
 * Check 8: Splash Screen
 */
async function checkSplashScreen() {
  header('8. Checking Splash Screen');

  try {
    const appJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../app.json'), 'utf8')
    );

    if (appJson.expo?.splash) {
      const splash = appJson.expo.splash;

      if (splash.image) {
        success('Splash screen: Image configured');
      } else {
        fail('Splash screen: Image not set');
      }

      if (splash.backgroundColor) {
        success(`Splash screen: Background color set (${splash.backgroundColor})`);
      } else {
        warn('Splash screen: Background color not set');
      }

      if (splash.resizeMode) {
        info(`Resize mode: ${splash.resizeMode}`);
      }
    } else {
      fail('Splash screen: Not configured in app.json');
    }
  } catch (error) {
    fail(`Splash screen: Error reading configuration - ${error.message}`);
  }
}

/**
 * Check 9: app.json Configuration
 */
async function checkAppJsonConfig() {
  header('9. Checking app.json Configuration');

  try {
    const appJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../app.json'), 'utf8')
    );

    const expo = appJson.expo;

    // Check required fields
    const requiredFields = {
      name: expo?.name,
      slug: expo?.slug,
      version: expo?.version,
      orientation: expo?.orientation,
      icon: expo?.icon,
      scheme: expo?.scheme,
    };

    Object.entries(requiredFields).forEach(([field, value]) => {
      if (value) {
        success(`app.json: ${field} = ${value}`);
      } else {
        fail(`app.json: ${field} is not set`);
      }
    });

    // Check iOS config
    if (expo?.ios) {
      if (expo.ios.bundleIdentifier) {
        success(`iOS: Bundle ID = ${expo.ios.bundleIdentifier}`);
      } else {
        fail('iOS: Bundle identifier not set');
      }

      if (expo.ios.buildNumber) {
        info(`iOS: Build number = ${expo.ios.buildNumber}`);
      }
    } else {
      fail('iOS: Configuration missing');
    }

    // Check Android config
    if (expo?.android) {
      if (expo.android.package) {
        success(`Android: Package name = ${expo.android.package}`);
      } else {
        fail('Android: Package name not set');
      }

      if (expo.android.versionCode) {
        info(`Android: Version code = ${expo.android.versionCode}`);
      }

      if (expo.android.permissions) {
        success(`Android: ${expo.android.permissions.length} permissions configured`);
      }
    } else {
      fail('Android: Configuration missing');
    }
  } catch (error) {
    fail(`app.json: Error reading file - ${error.message}`);
  }
}

/**
 * Check 10: Privacy Policy & Terms
 */
async function checkLegalDocuments() {
  header('10. Checking Legal Documents');

  try {
    const appJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../app.json'), 'utf8')
    );

    const privacyPolicy = appJson.expo?.extra?.privacyPolicyUrl;
    const termsOfService = appJson.expo?.extra?.termsOfServiceUrl;

    if (privacyPolicy) {
      success(`Privacy Policy URL: ${privacyPolicy}`);
    } else {
      fail('Privacy Policy URL: Not set in app.json');
    }

    if (termsOfService) {
      success(`Terms of Service URL: ${termsOfService}`);
    } else {
      fail('Terms of Service URL: Not set in app.json');
    }

    // Check if local files exist
    const privacyFile = path.join(__dirname, '../PRIVACY_POLICY.md');
    const termsFile = path.join(__dirname, '../TERMS_OF_SERVICE.md');

    if (fs.existsSync(privacyFile)) {
      info('Local privacy policy file: Found');
    } else {
      warn('Local privacy policy file: Not found');
    }

    if (fs.existsSync(termsFile)) {
      info('Local terms of service file: Found');
    } else {
      warn('Local terms of service file: Not found');
    }
  } catch (error) {
    fail(`Legal documents: Error - ${error.message}`);
  }
}

/**
 * Check 11: Required Dependencies
 */
async function checkDependencies() {
  header('11. Checking Required Dependencies');

  try {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8')
    );

    const requiredDeps = [
      'expo',
      'react',
      'react-native',
      'axios',
      '@react-native-async-storage/async-storage',
      '@react-navigation/native',
      'expo-notifications',
      'expo-location',
      'zustand',
    ];

    const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

    requiredDeps.forEach((dep) => {
      if (allDeps[dep]) {
        success(`Dependency: ${dep} (${allDeps[dep]})`);
      } else {
        fail(`Dependency: ${dep} is missing`);
      }
    });
  } catch (error) {
    fail(`Dependencies: Error reading package.json - ${error.message}`);
  }
}

/**
 * Check 12: TypeScript Configuration
 */
async function checkTypeScriptConfig() {
  header('12. Checking TypeScript Configuration');

  const tsConfigPath = path.join(__dirname, '../tsconfig.json');

  if (fs.existsSync(tsConfigPath)) {
    try {
      const tsConfig = JSON.parse(fs.readFileSync(tsConfigPath, 'utf8'));

      success('TypeScript: Configuration found');

      if (tsConfig.compilerOptions?.strict) {
        info('Strict mode: Enabled');
      } else {
        warn('Strict mode: Disabled');
      }

      if (tsConfig.extends) {
        info(`Extends: ${tsConfig.extends}`);
      }
    } catch (error) {
      fail(`TypeScript: Error parsing tsconfig.json - ${error.message}`);
    }
  } else {
    fail('TypeScript: tsconfig.json not found');
  }
}

/**
 * Check 13: Build Configuration
 */
async function checkBuildConfiguration() {
  header('13. Checking Build Configuration');

  const easJsonPath = path.join(__dirname, '../eas.json');

  if (fs.existsSync(easJsonPath)) {
    try {
      const easJson = JSON.parse(fs.readFileSync(easJsonPath, 'utf8'));

      if (easJson.build) {
        success('EAS Build: Configuration found');

        if (easJson.build.production) {
          success('EAS Build: Production profile configured');
        } else {
          fail('EAS Build: Production profile missing');
        }

        if (easJson.build.preview) {
          info('EAS Build: Preview profile configured');
        }

        if (easJson.build.development) {
          info('EAS Build: Development profile configured');
        }
      } else {
        fail('EAS Build: No build configuration found');
      }
    } catch (error) {
      fail(`EAS Build: Error parsing eas.json - ${error.message}`);
    }
  } else {
    warn('EAS Build: eas.json not found (optional if not using EAS)');
  }
}

/**
 * Check 14: App Store Assets
 */
async function checkAppStoreAssets() {
  header('14. Checking App Store Assets');

  const assetChecks = [
    {
      path: 'assets/icon.png',
      name: 'App Icon',
      required: true,
    },
    {
      path: 'assets/adaptive-icon.png',
      name: 'Android Adaptive Icon',
      required: true,
    },
    {
      path: 'assets/favicon.png',
      name: 'Favicon',
      required: false,
    },
    {
      path: 'app-store/screenshots-ios',
      name: 'iOS Screenshots Folder',
      required: false,
      isDirectory: true,
    },
    {
      path: 'app-store/screenshots-android',
      name: 'Android Screenshots Folder',
      required: false,
      isDirectory: true,
    },
  ];

  assetChecks.forEach((asset) => {
    const assetPath = path.join(__dirname, '..', asset.path);

    if (fs.existsSync(assetPath)) {
      if (asset.isDirectory) {
        const files = fs.readdirSync(assetPath);
        success(`${asset.name}: Found (${files.length} files)`);
      } else {
        const stats = fs.statSync(assetPath);
        const sizeKB = (stats.size / 1024).toFixed(2);
        success(`${asset.name}: Found (${sizeKB}KB)`);
      }
    } else if (asset.required) {
      fail(`${asset.name}: Not found at ${asset.path}`);
    } else {
      warn(`${asset.name}: Not found (optional)`);
    }
  });
}

/**
 * Check 15: Source Code Quality
 */
async function checkSourceCodeQuality() {
  header('15. Checking Source Code Quality');

  // Check for TypeScript errors would require running tsc
  // For now, just verify key files exist

  const keyFiles = [
    'App.tsx',
    'screens/ProductionTeacherDashboard.tsx',
    'screens/ProductionParentDashboard.tsx',
    'screens/ProductionAdminDashboard.tsx',
    'services/apiClient.ts',
    'contexts/AuthContext.tsx',
  ];

  keyFiles.forEach((file) => {
    const filePath = path.join(__dirname, '..', file);
    if (fs.existsSync(filePath)) {
      success(`Source file: ${file}`);
    } else {
      fail(`Source file: ${file} not found`);
    }
  });
}

/**
 * Generate Report
 */
function generateReport() {
  header('📊 Deployment Check Results');

  const total = results.passed.length + results.failed.length + results.warnings.length;
  const passedCount = results.passed.length;
  const failedCount = results.failed.length;
  const warningCount = results.warnings.length;

  log(`\nTotal Checks: ${total}`);
  log(`Passed: ${passedCount}`, colors.green);
  log(`Failed: ${failedCount}`, colors.red);
  log(`Warnings: ${warningCount}`, colors.yellow);

  // Calculate percentage
  const passPercentage = ((passedCount / total) * 100).toFixed(1);
  log(`\nPass Rate: ${passPercentage}%\n`);

  // Show failed items
  if (results.failed.length > 0) {
    log('\n❌ Failed Checks:', colors.red);
    results.failed.forEach((item) => {
      log(`  • ${item}`, colors.red);
    });
  }

  // Show warnings
  if (results.warnings.length > 0) {
    log('\n⚠️  Warnings:', colors.yellow);
    results.warnings.forEach((item) => {
      log(`  • ${item}`, colors.yellow);
    });
  }

  // Final verdict
  log('\n' + '='.repeat(60));
  if (results.failed.length === 0) {
    if (results.warnings.length === 0) {
      log('✅ ALL CHECKS PASSED - READY FOR DEPLOYMENT', colors.green);
      return 0;
    } else {
      log('✅ DEPLOYMENT READY WITH WARNINGS', colors.yellow);
      log('Consider addressing warnings before production release', colors.yellow);
      return 0;
    }
  } else {
    log('❌ DEPLOYMENT BLOCKED', colors.red);
    log('Fix failed checks before proceeding', colors.red);
    return 1;
  }
}

/**
 * Save report to file
 */
function saveReportToFile() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const reportPath = path.join(__dirname, `../deployment-check-${timestamp}.txt`);

  const report = [
    'Smart Campus Mobile - Pre-Deployment Check Report',
    '='.repeat(60),
    `Generated: ${new Date().toLocaleString()}`,
    '',
    `Total Checks: ${results.passed.length + results.failed.length + results.warnings.length}`,
    `Passed: ${results.passed.length}`,
    `Failed: ${results.failed.length}`,
    `Warnings: ${results.warnings.length}`,
    '',
    '='.repeat(60),
    '',
  ];

  if (results.passed.length > 0) {
    report.push('PASSED:');
    results.passed.forEach((item) => report.push(`  ✅ ${item}`));
    report.push('');
  }

  if (results.failed.length > 0) {
    report.push('FAILED:');
    results.failed.forEach((item) => report.push(`  ❌ ${item}`));
    report.push('');
  }

  if (results.warnings.length > 0) {
    report.push('WARNINGS:');
    results.warnings.forEach((item) => report.push(`  ⚠️  ${item}`));
    report.push('');
  }

  fs.writeFileSync(reportPath, report.join('\n'));
  info(`\n📄 Report saved to: ${reportPath}`);
}

/**
 * Main execution
 */
async function main() {
  log('\n🔍 Running Smart Campus Pre-Deployment Checks...', colors.blue);
  log('='.repeat(60), colors.blue);

  try {
    await checkEnvironmentVariables();
    await checkAPIEndpoint();
    await checkAWSCognito();
    await checkAWSS3();
    await checkGoogleMapsAPI();
    await checkPushNotifications();
    await checkAppIcons();
    await checkSplashScreen();
    await checkAppJsonConfig();
    await checkLegalDocuments();
    await checkDependencies();
    await checkTypeScriptConfig();
    await checkBuildConfiguration();
    await checkAppStoreAssets();
    await checkSourceCodeQuality();

    const exitCode = generateReport();
    saveReportToFile();

    process.exit(exitCode);
  } catch (error) {
    log(`\n💥 Fatal error during checks: ${error.message}`, colors.red);
    console.error(error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  // Skip checks during EAS builds or if SKIP_PREBUILD_CHECK is set
  if (process.env.EAS_BUILD || process.env.SKIP_PREBUILD_CHECK) {
    console.log('⏭️  Skipping pre-deployment checks during EAS build');
    process.exit(0);
  }
  main();
}

module.exports = { main };

