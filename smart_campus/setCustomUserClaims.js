const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
// Make sure to set GOOGLE_APPLICATION_CREDENTIALS environment variable
// or place your service account key file in the project root
const serviceAccount = require('./path-to-your-service-account-key.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  // Add your project ID here
  projectId: 'your-project-id'
});

const db = admin.firestore();

/**
 * Set custom claims for a user
 * @param {string} uid - User's Firebase Auth UID
 * @param {string} role - User's role (admin, principal, teacher, parent, helper)
 * @param {string} schoolId - School ID (optional, not required for admin)
 * @param {object} additionalClaims - Additional custom claims (optional)
 */
async function setCustomUserClaims(uid, role, schoolId = null, additionalClaims = {}) {
  try {
    // Validate role
    const validRoles = ['admin', 'principal', 'teacher', 'parent', 'helper'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role: ${role}. Must be one of: ${validRoles.join(', ')}`);
    }

    // Validate schoolId for non-admin roles
    if (role !== 'admin' && !schoolId) {
      throw new Error(`School ID is required for role: ${role}`);
    }

    // Prepare custom claims
    const customClaims = {
      role: role,
      ...additionalClaims
    };

    // Add schoolId if provided
    if (schoolId) {
      customClaims.schoolId = schoolId;
    }

    // Set custom claims
    await admin.auth().setCustomUserClaims(uid, customClaims);

    console.log(`✅ Successfully set custom claims for user ${uid}:`, customClaims);

    // Verify the claims were set
    const user = await admin.auth().getUser(uid);
    console.log('📋 User custom claims:', user.customClaims);

    return { success: true, claims: customClaims };
  } catch (error) {
    console.error('❌ Error setting custom claims:', error.message);
    throw error;
  }
}

/**
 * Get user's custom claims
 * @param {string} uid - User's Firebase Auth UID
 */
async function getCustomUserClaims(uid) {
  try {
    const user = await admin.auth().getUser(uid);
    return user.customClaims;
  } catch (error) {
    console.error('❌ Error getting custom claims:', error.message);
    throw error;
  }
}

/**
 * Remove custom claims from a user
 * @param {string} uid - User's Firebase Auth UID
 */
async function removeCustomUserClaims(uid) {
  try {
    await admin.auth().setCustomUserClaims(uid, null);
    console.log(`✅ Successfully removed custom claims for user ${uid}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error removing custom claims:', error.message);
    throw error;
  }
}

/**
 * Batch set custom claims for multiple users
 * @param {Array} users - Array of user objects with uid, role, schoolId
 */
async function batchSetCustomUserClaims(users) {
  const results = [];
  
  for (const user of users) {
    try {
      const result = await setCustomUserClaims(user.uid, user.role, user.schoolId, user.additionalClaims);
      results.push({ uid: user.uid, success: true, result });
    } catch (error) {
      results.push({ uid: user.uid, success: false, error: error.message });
    }
  }
  
  return results;
}

/**
 * Create a user and set their role
 * @param {string} email - User's email
 * @param {string} password - User's password
 * @param {string} role - User's role
 * @param {string} schoolId - School ID (optional)
 * @param {object} additionalData - Additional user data
 */
async function createUserWithRole(email, password, role, schoolId = null, additionalData = {}) {
  try {
    // Create user
    const userRecord = await admin.auth().createUser({
      email: email,
      password: password,
      displayName: additionalData.displayName || email.split('@')[0],
      ...additionalData
    });

    console.log(`✅ Created user: ${userRecord.uid}`);

    // Set custom claims
    await setCustomUserClaims(userRecord.uid, role, schoolId, additionalData.customClaims);

    // Create user profile in Firestore
    const userProfile = {
      uid: userRecord.uid,
      email: email,
      role: role,
      schoolId: schoolId,
      displayName: additionalData.displayName || email.split('@')[0],
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      ...additionalData.profileData
    };

    await db.collection('userProfiles').doc(userRecord.uid).set(userProfile);
    console.log(`✅ Created user profile in Firestore`);

    return { success: true, uid: userRecord.uid, userRecord };
  } catch (error) {
    console.error('❌ Error creating user with role:', error.message);
    throw error;
  }
}

/**
 * Update user's role
 * @param {string} uid - User's Firebase Auth UID
 * @param {string} newRole - New role
 * @param {string} schoolId - School ID (optional)
 */
async function updateUserRole(uid, newRole, schoolId = null) {
  try {
    // Get current claims
    const currentClaims = await getCustomUserClaims(uid);
    
    // Update claims
    const updatedClaims = {
      ...currentClaims,
      role: newRole
    };

    if (schoolId) {
      updatedClaims.schoolId = schoolId;
    }

    await setCustomUserClaims(uid, newRole, schoolId, updatedClaims);

    // Update user profile in Firestore
    await db.collection('userProfiles').doc(uid).update({
      role: newRole,
      schoolId: schoolId,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log(`✅ Updated user role to ${newRole}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Error updating user role:', error.message);
    throw error;
  }
}

// Example usage and test functions
async function runExamples() {
  try {
    console.log('🚀 Running custom claims examples...\n');

    // Example 1: Set role for existing user
    console.log('1. Setting role for existing user...');
    await setCustomUserClaims('user-uid-here', 'teacher', 'SCH-2025-A12');
    
    // Example 2: Create admin user
    console.log('\n2. Creating admin user...');
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

    // Example 3: Create teacher user
    console.log('\n3. Creating teacher user...');
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

    // Example 4: Create parent user
    console.log('\n4. Creating parent user...');
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

    // Example 5: Create helper user
    console.log('\n5. Creating helper user...');
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

    // Example 6: Batch create users
    console.log('\n6. Batch creating users...');
    const batchUsers = [
      { uid: 'user1', role: 'teacher', schoolId: 'SCH-2025-A12' },
      { uid: 'user2', role: 'parent', schoolId: 'SCH-2025-A12' },
      { uid: 'user3', role: 'helper', schoolId: 'SCH-2025-B45' }
    ];
    
    const batchResults = await batchSetCustomUserClaims(batchUsers);
    console.log('Batch results:', batchResults);

    console.log('\n✅ All examples completed successfully!');

  } catch (error) {
    console.error('❌ Error running examples:', error.message);
  }
}

// Export functions for use in other modules
module.exports = {
  setCustomUserClaims,
  getCustomUserClaims,
  removeCustomUserClaims,
  batchSetCustomUserClaims,
  createUserWithRole,
  updateUserRole
};

// Run examples if this file is executed directly
if (require.main === module) {
  runExamples().then(() => {
    console.log('\n🎉 Script completed!');
    process.exit(0);
  }).catch((error) => {
    console.error('💥 Script failed:', error.message);
    process.exit(1);
  });
}
