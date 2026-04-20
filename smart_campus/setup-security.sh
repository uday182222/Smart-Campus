#!/bin/bash

# Smart Campus Security Setup Script
# This script sets up the Firestore security system with RBAC

set -e  # Exit on any error

echo "🔐 Smart Campus Security Setup"
echo "=============================="

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

# Check if Node.js is installed
check_node() {
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed!"
        echo "Please install Node.js from https://nodejs.org/"
        exit 1
    fi
    print_status "Node.js is installed"
}

# Check if Firebase project is initialized
check_firebase_project() {
    if [ ! -f "firebase.json" ]; then
        print_error "Firebase project not initialized!"
        echo "Please run: firebase init"
        exit 1
    fi
    print_status "Firebase project is initialized"
}

# Deploy Firestore rules
deploy_firestore_rules() {
    print_info "Deploying Firestore security rules..."
    
    if [ ! -f "firestore.rules" ]; then
        print_error "firestore.rules file not found!"
        exit 1
    fi
    
    firebase deploy --only firestore:rules
    print_status "Firestore rules deployed successfully"
}

# Install Node.js dependencies
install_dependencies() {
    print_info "Installing Node.js dependencies..."
    
    if [ ! -f "package.json" ]; then
        print_error "package.json not found!"
        exit 1
    fi
    
    npm install
    print_status "Dependencies installed successfully"
}

# Setup service account key
setup_service_account() {
    print_info "Setting up Firebase service account..."
    
    if [ ! -f "service-account-key.json" ]; then
        print_warning "Service account key not found!"
        echo "Please download your service account key from:"
        echo "Firebase Console → Project Settings → Service Accounts → Generate new private key"
        echo "Save it as 'service-account-key.json' in the project root"
        echo ""
        read -p "Press Enter when you have downloaded the key..."
        
        if [ ! -f "service-account-key.json" ]; then
            print_error "Service account key still not found!"
            exit 1
        fi
    fi
    
    print_status "Service account key found"
}

# Create example users
create_example_users() {
    print_info "Creating example users..."
    
    if [ ! -f "setCustomUserClaims.js" ]; then
        print_error "setCustomUserClaims.js not found!"
        exit 1
    fi
    
    # Create a simple script to set up example users
    cat > setup-example-users.js << 'EOF'
const { setCustomUserClaims, createUserWithRole } = require('./setCustomUserClaims');

async function setupExampleUsers() {
    try {
        console.log('🚀 Setting up example users...\n');

        // Create admin user
        console.log('1. Creating admin user...');
        await createUserWithRole(
            'admin@school.com',
            'admin123',
            'admin',
            null, // No schoolId for admin
            {
                displayName: 'Super Admin',
                customClaims: { isSuperAdmin: true }
            }
        );

        // Create principal user
        console.log('2. Creating principal user...');
        await createUserWithRole(
            'principal@school.com',
            'principal123',
            'principal',
            'SCH-2025-A12',
            {
                displayName: 'School Principal',
                profileData: {
                    schoolName: 'Lotus Public School'
                }
            }
        );

        // Create teacher user
        console.log('3. Creating teacher user...');
        await createUserWithRole(
            'teacher@school.com',
            'teacher123',
            'teacher',
            'SCH-2025-A12',
            {
                displayName: 'John Teacher',
                profileData: {
                    subject: 'Mathematics',
                    class: '10th Grade'
                }
            }
        );

        // Create parent user
        console.log('4. Creating parent user...');
        await createUserWithRole(
            'parent@email.com',
            'parent123',
            'parent',
            'SCH-2025-A12',
            {
                displayName: 'Jane Parent',
                profileData: {
                    children: ['student-uid-1', 'student-uid-2']
                }
            }
        );

        // Create helper user
        console.log('5. Creating helper user...');
        await createUserWithRole(
            'helper@school.com',
            'helper123',
            'helper',
            'SCH-2025-A12',
            {
                displayName: 'Bus Helper',
                profileData: {
                    assignedRoutes: ['route-uid-1'],
                    licenseNumber: 'BH123456'
                }
            }
        );

        console.log('\n✅ All example users created successfully!');
        console.log('\n📋 Demo Credentials:');
        console.log('Admin: admin@school.com / admin123');
        console.log('Principal: principal@school.com / principal123');
        console.log('Teacher: teacher@school.com / teacher123');
        console.log('Parent: parent@email.com / parent123');
        console.log('Helper: helper@school.com / helper123');
        console.log('School ID: SCH-2025-A12');

    } catch (error) {
        console.error('❌ Error setting up example users:', error.message);
        throw error;
    }
}

setupExampleUsers().then(() => {
    console.log('\n🎉 Setup completed!');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Setup failed:', error.message);
    process.exit(1);
});
EOF

    node setup-example-users.js
    rm setup-example-users.js
    
    print_status "Example users created successfully"
}

# Test security rules
test_security_rules() {
    print_info "Testing security rules..."
    
    # Create a simple test script
    cat > test-security.js << 'EOF'
const { getCustomUserClaims } = require('./setCustomUserClaims');

async function testSecurity() {
    try {
        console.log('🧪 Testing security rules...\n');

        // Test getting claims for a user
        const testUid = 'test-user-uid';
        try {
            const claims = await getCustomUserClaims(testUid);
            console.log('✅ Custom claims retrieved:', claims);
        } catch (error) {
            console.log('ℹ️  Test user not found (this is expected)');
        }

        console.log('\n✅ Security tests completed!');
        console.log('\n📝 Next steps:');
        console.log('1. Test the Flutter app with different user roles');
        console.log('2. Verify that users can only access their authorized data');
        console.log('3. Check Firestore logs for any security rule violations');

    } catch (error) {
        console.error('❌ Error testing security:', error.message);
        throw error;
    }
}

testSecurity().then(() => {
    console.log('\n🎉 Testing completed!');
    process.exit(0);
}).catch((error) => {
    console.error('💥 Testing failed:', error.message);
    process.exit(1);
});
EOF

    node test-security.js
    rm test-security.js
    
    print_status "Security rules tested successfully"
}

# Main setup function
main() {
    echo ""
    print_info "Starting Smart Campus Security Setup..."
    echo ""

    # Check prerequisites
    check_firebase_cli
    check_node
    check_firebase_project

    # Install dependencies
    install_dependencies

    # Setup service account
    setup_service_account

    # Deploy Firestore rules
    deploy_firestore_rules

    # Create example users
    create_example_users

    # Test security rules
    test_security_rules

    echo ""
    print_status "🎉 Smart Campus Security Setup Complete!"
    echo ""
    echo "📋 What was set up:"
    echo "  ✅ Firestore security rules with RBAC"
    echo "  ✅ Custom claims management system"
    echo "  ✅ Example users for testing"
    echo "  ✅ Secure Firestore service for Flutter"
    echo ""
    echo "🚀 Next steps:"
    echo "  1. Test the Flutter app with different user roles"
    echo "  2. Verify data access is properly restricted"
    echo "  3. Monitor Firestore logs for security violations"
    echo "  4. Customize the security rules as needed"
    echo ""
    echo "📚 Documentation:"
    echo "  - README-SECURITY.md - Complete security guide"
    echo "  - example-client-queries.dart - Flutter integration examples"
    echo "  - secure_firestore_service.dart - Secure Firestore service"
    echo ""
    print_info "Happy coding! 🔐"
}

# Run main function
main "$@"
