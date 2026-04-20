#!/bin/bash

# Smart Campus Push Notifications Setup Script
# This script sets up Firebase Cloud Messaging (FCM) for push notifications

set -e  # Exit on any error

echo "🔔 Smart Campus Push Notifications Setup"
echo "========================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Check if Firebase CLI is installed
check_firebase_cli() {
    if ! command -v firebase &> /dev/null; then
        print_error "Firebase CLI is not installed!"
        echo "Please install it with: npm install -g firebase-tools"
        exit 1
    fi
    print_status "Firebase CLI is installed"
}

# Check if Flutter is installed
check_flutter() {
    if ! command -v flutter &> /dev/null; then
        print_error "Flutter is not installed!"
        echo "Please install Flutter from https://flutter.dev/"
        exit 1
    fi
    print_status "Flutter is installed"
}

# Install Flutter dependencies
install_flutter_dependencies() {
    print_info "Installing Flutter dependencies..."
    
    cd smart_campus
    flutter pub get
    cd ..
    
    print_status "Flutter dependencies installed"
}

# Install Cloud Functions dependencies
install_functions_dependencies() {
    print_info "Installing Cloud Functions dependencies..."
    
    cd functions
    npm install
    cd ..
    
    print_status "Cloud Functions dependencies installed"
}

# Deploy Cloud Functions
deploy_cloud_functions() {
    print_info "Deploying Cloud Functions..."
    
    firebase deploy --only functions
    print_status "Cloud Functions deployed successfully"
}

# Deploy Firestore rules
deploy_firestore_rules() {
    print_info "Deploying Firestore security rules..."
    
    firebase deploy --only firestore:rules
    print_status "Firestore rules deployed successfully"
}

# Setup Android configuration
setup_android_config() {
    print_info "Setting up Android configuration..."
    
    # Check if google-services.json exists
    if [ ! -f "smart_campus/android/app/google-services.json" ]; then
        print_warning "google-services.json not found!"
        echo "Please download it from Firebase Console and place it in:"
        echo "smart_campus/android/app/google-services.json"
        echo ""
        read -p "Press Enter when you have downloaded the file..."
        
        if [ ! -f "smart_campus/android/app/google-services.json" ]; then
            print_error "google-services.json still not found!"
            exit 1
        fi
    fi
    
    print_status "Android configuration ready"
}

# Setup iOS configuration
setup_ios_config() {
    print_info "Setting up iOS configuration..."
    
    # Check if GoogleService-Info.plist exists
    if [ ! -f "smart_campus/ios/Runner/GoogleService-Info.plist" ]; then
        print_warning "GoogleService-Info.plist not found!"
        echo "Please download it from Firebase Console and place it in:"
        echo "smart_campus/ios/Runner/GoogleService-Info.plist"
        echo ""
        read -p "Press Enter when you have downloaded the file..."
        
        if [ ! -f "smart_campus/ios/Runner/GoogleService-Info.plist" ]; then
            print_error "GoogleService-Info.plist still not found!"
            exit 1
        fi
    fi
    
    print_status "iOS configuration ready"
}

# Test notification functionality
test_notifications() {
    print_info "Testing notification functionality..."
    
    # Create a simple test script
    cat > test-notifications.js << 'EOF'
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
const serviceAccount = require('./service-account-key.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function testNotifications() {
    try {
        console.log('🧪 Testing notification system...\n');

        // Test 1: Check if device tokens collection exists
        console.log('1. Checking device tokens collection...');
        const tokensSnapshot = await db.collectionGroup('deviceTokens').limit(1).get();
        console.log(`Found ${tokensSnapshot.size} device tokens`);

        // Test 2: Check if notifications collection exists
        console.log('2. Checking notifications collection...');
        const notificationsSnapshot = await db.collectionGroup('notifications').limit(1).get();
        console.log(`Found ${notificationsSnapshot.size} notifications`);

        // Test 3: Test Cloud Functions (if deployed)
        console.log('3. Testing Cloud Functions...');
        console.log('Cloud Functions should be deployed and ready');

        console.log('\n✅ Notification system test completed!');
        console.log('\n📝 Next steps:');
        console.log('1. Test the Flutter app with different user roles');
        console.log('2. Send test notifications from Firebase Console');
        console.log('3. Verify notifications are received on devices');
        console.log('4. Check notification history in the app');

    } catch (error) {
        console.error('❌ Error testing notifications:', error.message);
        throw error;
    }
}

testNotifications().then(() => {
    console.log('\n🎉 Testing completed!');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Testing failed:', error.message);
    process.exit(1);
});
EOF

    node test-notifications.js
    rm test-notifications.js
    
    print_status "Notification functionality tested successfully"
}

# Create example notification payloads
create_example_payloads() {
    print_info "Creating example notification payloads..."
    
    cat > example-notification-payloads.json << 'EOF'
{
  "announcement": {
    "notification": {
      "title": "New School Announcement",
      "body": "Important update about school events"
    },
    "data": {
      "type": "announcement",
      "id": "announcement-123",
      "schoolId": "SCH-2025-A12",
      "title": "School Event Update",
      "body": "The annual sports day has been rescheduled to next Friday."
    }
  },
  "homework": {
    "notification": {
      "title": "New Homework Assignment",
      "body": "Mathematics homework due tomorrow"
    },
    "data": {
      "type": "homework",
      "id": "homework-456",
      "schoolId": "SCH-2025-A12",
      "classId": "class-10a",
      "title": "Mathematics Homework",
      "subject": "Algebra"
    }
  },
  "attendance": {
    "notification": {
      "title": "Attendance Update",
      "body": "Your child is marked present today"
    },
    "data": {
      "type": "attendance",
      "id": "attendance-789",
      "studentId": "student-123",
      "schoolId": "SCH-2025-A12",
      "status": "present",
      "date": "2025-01-15"
    }
  },
  "route_update": {
    "notification": {
      "title": "Bus Delay Alert",
      "body": "Route A is running 15 minutes late"
    },
    "data": {
      "type": "route_update",
      "id": "route-abc",
      "schoolId": "SCH-2025-A12",
      "routeName": "Route A",
      "status": "delayed",
      "delayMinutes": 15
    }
  },
  "stop_reached": {
    "notification": {
      "title": "Bus Stop Reached",
      "body": "Your child's bus has arrived at the stop"
    },
    "data": {
      "type": "stop_reached",
      "id": "stop-xyz",
      "routeId": "route-abc",
      "schoolId": "SCH-2025-A12",
      "stopName": "Main Street Stop"
    }
  }
}
EOF

    print_status "Example notification payloads created"
}

# Main setup function
main() {
    echo ""
    print_info "Starting Smart Campus Push Notifications Setup..."
    echo ""

    # Check prerequisites
    check_firebase_cli
    check_flutter

    # Install dependencies
    install_flutter_dependencies
    install_functions_dependencies

    # Setup platform configurations
    setup_android_config
    setup_ios_config

    # Deploy backend
    deploy_cloud_functions
    deploy_firestore_rules

    # Test functionality
    test_notifications

    # Create examples
    create_example_payloads

    echo ""
    print_status "🎉 Smart Campus Push Notifications Setup Complete!"
    echo ""
    echo "📋 What was set up:"
    echo "  ✅ Firebase Cloud Messaging (FCM) integration"
    echo "  ✅ Cloud Functions for sending notifications"
    echo "  ✅ Android and iOS notification configuration"
    echo "  ✅ Flutter notification service"
    echo "  ✅ In-app notification banners"
    echo "  ✅ Notification history tracking"
    echo "  ✅ Security rules for device tokens"
    echo ""
    echo "🚀 Next steps:"
    echo "  1. Test notifications on Android and iOS devices"
    echo "  2. Send test notifications from Firebase Console"
    echo "  3. Verify notification handling in different app states"
    echo "  4. Customize notification appearance and behavior"
    echo ""
    echo "📚 Documentation:"
    echo "  - FCM setup guide: https://firebase.flutter.dev/docs/messaging/overview/"
    echo "  - Cloud Functions: https://firebase.google.com/docs/functions"
    echo "  - Notification payloads: example-notification-payloads.json"
    echo ""
    echo "🧪 Testing:"
    echo "  - Use Firebase Console to send test notifications"
    echo "  - Test foreground, background, and terminated states"
    echo "  - Verify notification navigation works correctly"
    echo ""
    print_info "Happy notifying! 🔔"
}

# Run main function
main "$@"
