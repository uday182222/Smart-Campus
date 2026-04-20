const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();
const messaging = admin.messaging();

/**
 * Send push notification to multiple users
 * @param {Array} tokens - Array of device tokens
 * @param {Object} notification - Notification payload
 * @param {Object} data - Additional data payload
 * @param {Object} options - Additional options
 */
async function sendPushNotification(tokens, notification, data = {}, options = {}) {
  if (!tokens || tokens.length === 0) {
    console.log('No tokens to send notification to');
    return;
  }

  const message = {
    notification: {
      title: notification.title,
      body: notification.body,
      imageUrl: notification.imageUrl,
    },
    data: {
      ...data,
      timestamp: Date.now().toString(),
    },
    android: {
      priority: 'high',
      notification: {
        icon: 'ic_notification',
        color: '#2196F3',
        sound: 'default',
        channelId: 'smart_campus_notifications',
        ...options.android,
      },
    },
    apns: {
      payload: {
        aps: {
          sound: 'default',
          badge: 1,
          ...options.apns,
        },
      },
    },
    tokens: tokens,
  };

  try {
    const response = await messaging.sendMulticast(message);
    console.log(`Successfully sent message to ${response.successCount} devices`);
    
    if (response.failureCount > 0) {
      console.log(`Failed to send message to ${response.failureCount} devices`);
      
      // Clean up invalid tokens
      const invalidTokens = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          console.log(`Token ${tokens[idx]} failed: ${resp.error?.message}`);
          if (resp.error?.code === 'messaging/invalid-registration-token' ||
              resp.error?.code === 'messaging/registration-token-not-registered') {
            invalidTokens.push(tokens[idx]);
          }
        }
      });
      
      if (invalidTokens.length > 0) {
        await cleanupInvalidTokens(invalidTokens);
      }
    }
    
    return response;
  } catch (error) {
    console.error('Error sending push notification:', error);
    throw error;
  }
}

/**
 * Clean up invalid device tokens
 * @param {Array} invalidTokens - Array of invalid tokens to remove
 */
async function cleanupInvalidTokens(invalidTokens) {
  try {
    const batch = db.batch();
    
    for (const token of invalidTokens) {
      // Find and delete the token document
      const tokenQuery = await db
        .collectionGroup('deviceTokens')
        .where('token', '==', token)
        .get();
      
      tokenQuery.docs.forEach(doc => {
        batch.delete(doc.ref);
      });
    }
    
    await batch.commit();
    console.log(`Cleaned up ${invalidTokens.length} invalid tokens`);
  } catch (error) {
    console.error('Error cleaning up invalid tokens:', error);
  }
}

/**
 * Get device tokens for users in a school
 * @param {string} schoolId - School ID
 * @param {Array} roles - Array of roles to include (optional)
 * @returns {Promise<Array>} Array of device tokens
 */
async function getDeviceTokensForSchool(schoolId, roles = []) {
  try {
    let query = db.collectionGroup('deviceTokens')
      .where('schoolId', '==', schoolId)
      .where('isActive', '==', true);
    
    if (roles.length > 0) {
      query = query.where('role', 'in', roles);
    }
    
    const snapshot = await query.get();
    return snapshot.docs.map(doc => doc.data().token);
  } catch (error) {
    console.error('Error getting device tokens for school:', error);
    return [];
  }
}

/**
 * Get device tokens for specific users
 * @param {Array} userIds - Array of user IDs
 * @returns {Promise<Array>} Array of device tokens
 */
async function getDeviceTokensForUsers(userIds) {
  try {
    const tokens = [];
    
    for (const userId of userIds) {
      const snapshot = await db
        .collection('users')
        .doc(userId)
        .collection('deviceTokens')
        .where('isActive', '==', true)
        .get();
      
      snapshot.docs.forEach(doc => {
        tokens.push(doc.data().token);
      });
    }
    
    return tokens;
  } catch (error) {
    console.error('Error getting device tokens for users:', error);
    return [];
  }
}

/**
 * Save notification to user's notification history
 * @param {string} userId - User ID
 * @param {Object} notification - Notification data
 */
async function saveNotificationToHistory(userId, notification) {
  try {
    await db.collection('users').doc(userId).collection('notifications').add({
      ...notification,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isRead: false,
    });
  } catch (error) {
    console.error('Error saving notification to history:', error);
  }
}

// ==================== FIRESTORE TRIGGERS ====================

/**
 * Trigger: New announcement created
 * Notify all parents and teachers in the school
 */
exports.onAnnouncementCreated = functions.firestore
  .document('announcements/{announcementId}')
  .onCreate(async (snap, context) => {
    try {
      const announcement = snap.data();
      const announcementId = context.params.announcementId;
      const schoolId = announcement.schoolId;
      
      if (!schoolId) {
        console.log('No schoolId found in announcement');
        return;
      }

      console.log(`New announcement created: ${announcementId} for school: ${schoolId}`);

      // Get device tokens for parents and teachers in the school
      const tokens = await getDeviceTokensForSchool(schoolId, ['parent', 'teacher']);
      
      if (tokens.length === 0) {
        console.log('No device tokens found for school');
        return;
      }

      // Prepare notification
      const notification = {
        title: 'New Announcement',
        body: announcement.title || 'A new announcement has been posted',
        imageUrl: announcement.imageUrl,
      };

      const data = {
        type: 'announcement',
        id: announcementId,
        schoolId: schoolId,
        title: announcement.title,
        body: announcement.body,
      };

      // Send push notification
      await sendPushNotification(tokens, notification, data);

      // Save to notification history for each user
      const usersSnapshot = await db
        .collection('users')
        .where('schoolId', '==', schoolId)
        .where('role', 'in', ['parent', 'teacher'])
        .get();

      const notificationData = {
        type: 'announcement',
        title: notification.title,
        body: notification.body,
        data: data,
      };

      for (const userDoc of usersSnapshot.docs) {
        await saveNotificationToHistory(userDoc.id, notificationData);
      }

      console.log(`Announcement notification sent to ${tokens.length} devices`);
    } catch (error) {
      console.error('Error in onAnnouncementCreated:', error);
    }
  });

/**
 * Trigger: New homework created
 * Notify relevant students and their parents
 */
exports.onHomeworkCreated = functions.firestore
  .document('homework/{homeworkId}')
  .onCreate(async (snap, context) => {
    try {
      const homework = snap.data();
      const homeworkId = context.params.homeworkId;
      const schoolId = homework.schoolId;
      const classId = homework.classId;
      const studentIds = homework.studentIds || [];
      
      if (!schoolId) {
        console.log('No schoolId found in homework');
        return;
      }

      console.log(`New homework created: ${homeworkId} for school: ${schoolId}`);

      let tokens = [];

      if (studentIds.length > 0) {
        // Get tokens for specific students and their parents
        const studentTokens = await getDeviceTokensForUsers(studentIds);
        tokens.push(...studentTokens);

        // Get parent tokens for these students
        for (const studentId of studentIds) {
          const studentDoc = await db.collection('students').doc(studentId).get();
          if (studentDoc.exists) {
            const studentData = studentDoc.data();
            const parentId = studentData.parentId;
            if (parentId) {
              const parentTokens = await getDeviceTokensForUsers([parentId]);
              tokens.push(...parentTokens);
            }
          }
        }
      } else if (classId) {
        // Get tokens for all students in the class and their parents
        const studentsSnapshot = await db
          .collection('students')
          .where('schoolId', '==', schoolId)
          .where('classId', '==', classId)
          .get();

        const studentIds = studentsSnapshot.docs.map(doc => doc.id);
        tokens = await getDeviceTokensForUsers(studentIds);

        // Get parent tokens
        for (const studentDoc of studentsSnapshot.docs) {
          const studentData = studentDoc.data();
          const parentId = studentData.parentId;
          if (parentId) {
            const parentTokens = await getDeviceTokensForUsers([parentId]);
            tokens.push(...parentTokens);
          }
        }
      } else {
        // Get tokens for all parents and teachers in the school
        tokens = await getDeviceTokensForSchool(schoolId, ['parent', 'teacher']);
      }

      // Remove duplicates
      tokens = [...new Set(tokens)];

      if (tokens.length === 0) {
        console.log('No device tokens found for homework notification');
        return;
      }

      // Prepare notification
      const notification = {
        title: 'New Homework Assignment',
        body: homework.title || 'A new homework assignment has been posted',
      };

      const data = {
        type: 'homework',
        id: homeworkId,
        schoolId: schoolId,
        classId: classId,
        title: homework.title,
        subject: homework.subject,
      };

      // Send push notification
      await sendPushNotification(tokens, notification, data);

      console.log(`Homework notification sent to ${tokens.length} devices`);
    } catch (error) {
      console.error('Error in onHomeworkCreated:', error);
    }
  });

/**
 * Trigger: Route status updated
 * Notify parents when bus stop status changes
 */
exports.onRouteStatusUpdated = functions.firestore
  .document('routes/{routeId}')
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data();
      const after = change.after.data();
      const routeId = context.params.routeId;
      const schoolId = after.schoolId;
      
      if (!schoolId) {
        console.log('No schoolId found in route');
        return;
      }

      // Check if status actually changed
      if (before.status === after.status) {
        console.log('Route status unchanged, skipping notification');
        return;
      }

      console.log(`Route status updated: ${routeId} for school: ${schoolId}`);

      // Get device tokens for parents in the school
      const tokens = await getDeviceTokensForSchool(schoolId, ['parent']);
      
      if (tokens.length === 0) {
        console.log('No parent device tokens found for route notification');
        return;
      }

      // Prepare notification based on status
      let notification;
      if (after.status === 'delayed') {
        notification = {
          title: 'Bus Delay Alert',
          body: `Route ${after.routeName || routeId} is running ${after.delayMinutes || 'some'} minutes late`,
        };
      } else if (after.status === 'arrived') {
        notification = {
          title: 'Bus Arrived',
          body: `Route ${after.routeName || routeId} has arrived at the stop`,
        };
      } else if (after.status === 'departed') {
        notification = {
          title: 'Bus Departed',
          body: `Route ${after.routeName || routeId} has departed from the stop`,
        };
      } else {
        notification = {
          title: 'Route Status Update',
          body: `Route ${after.routeName || routeId} status: ${after.status}`,
        };
      }

      const data = {
        type: 'route_update',
        id: routeId,
        schoolId: schoolId,
        routeName: after.routeName,
        status: after.status,
        delayMinutes: after.delayMinutes,
      };

      // Send push notification
      await sendPushNotification(tokens, notification, data);

      console.log(`Route notification sent to ${tokens.length} devices`);
    } catch (error) {
      console.error('Error in onRouteStatusUpdated:', error);
    }
  });

/**
 * Trigger: Transport stop reached
 * Notify parents when their child's bus stop is reached
 */
exports.onStopReached = functions.firestore
  .document('transportStops/{stopId}')
  .onUpdate(async (change, context) => {
    try {
      const before = change.before.data();
      const after = change.after.data();
      const stopId = context.params.stopId;
      
      // Check if stop was just reached
      if (before.status !== 'reached' && after.status === 'reached') {
        const routeId = after.routeId;
        const schoolId = after.schoolId;
        
        if (!schoolId || !routeId) {
          console.log('Missing schoolId or routeId in stop data');
          return;
        }

        console.log(`Stop reached: ${stopId} for route: ${routeId}`);

        // Get students assigned to this route
        const studentsSnapshot = await db
          .collection('students')
          .where('schoolId', '==', schoolId)
          .where('routeId', '==', routeId)
          .get();

        if (studentsSnapshot.empty) {
          console.log('No students found for this route');
          return;
        }

        // Get parent tokens for these students
        const tokens = [];
        for (const studentDoc of studentsSnapshot.docs) {
          const studentData = studentDoc.data();
          const parentId = studentData.parentId;
          if (parentId) {
            const parentTokens = await getDeviceTokensForUsers([parentId]);
            tokens.push(...parentTokens);
          }
        }

        // Remove duplicates
        const uniqueTokens = [...new Set(tokens)];

        if (uniqueTokens.length === 0) {
          console.log('No parent device tokens found for stop notification');
          return;
        }

        // Prepare notification
        const notification = {
          title: 'Bus Stop Reached',
          body: `Your child's bus has reached ${after.stopName || 'the stop'}`,
        };

        const data = {
          type: 'stop_reached',
          id: stopId,
          routeId: routeId,
          schoolId: schoolId,
          stopName: after.stopName,
          arrivalTime: after.arrivalTime,
        };

        // Send push notification
        await sendPushNotification(uniqueTokens, notification, data);

        console.log(`Stop notification sent to ${uniqueTokens.length} devices`);
      }
    } catch (error) {
      console.error('Error in onStopReached:', error);
    }
  });

/**
 * Trigger: Attendance marked
 * Notify parents when their child's attendance is marked
 */
exports.onAttendanceMarked = functions.firestore
  .document('attendance/{attendanceId}')
  .onCreate(async (snap, context) => {
    try {
      const attendance = snap.data();
      const attendanceId = context.params.attendanceId;
      const studentId = attendance.studentId;
      const schoolId = attendance.schoolId;
      
      if (!studentId || !schoolId) {
        console.log('Missing studentId or schoolId in attendance data');
        return;
      }

      console.log(`Attendance marked: ${attendanceId} for student: ${studentId}`);

      // Get student data to find parent
      const studentDoc = await db.collection('students').doc(studentId).get();
      if (!studentDoc.exists) {
        console.log('Student not found');
        return;
      }

      const studentData = studentDoc.data();
      const parentId = studentData.parentId;
      
      if (!parentId) {
        console.log('No parent found for student');
        return;
      }

      // Get parent device tokens
      const tokens = await getDeviceTokensForUsers([parentId]);
      
      if (tokens.length === 0) {
        console.log('No parent device tokens found for attendance notification');
        return;
      }

      // Prepare notification
      const status = attendance.status;
      const statusText = status === 'present' ? 'present' : 
                        status === 'absent' ? 'absent' : 
                        status === 'late' ? 'late' : status;

      const notification = {
        title: 'Attendance Update',
        body: `${studentData.name || 'Your child'} is marked ${statusText} today`,
      };

      const data = {
        type: 'attendance',
        id: attendanceId,
        studentId: studentId,
        schoolId: schoolId,
        status: status,
        date: attendance.date,
      };

      // Send push notification
      await sendPushNotification(tokens, notification, data);

      // Save to parent's notification history
      await saveNotificationToHistory(parentId, {
        type: 'attendance',
        title: notification.title,
        body: notification.body,
        data: data,
      });

      console.log(`Attendance notification sent to ${tokens.length} devices`);
    } catch (error) {
      console.error('Error in onAttendanceMarked:', error);
    }
  });

// ==================== MANUAL TRIGGERS ====================

/**
 * Manual function to send custom notification
 * Can be called from admin panel or other triggers
 */
exports.sendCustomNotification = functions.https.onCall(async (data, context) => {
  try {
    // Verify authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { schoolId, roles, title, body, data: notificationData } = data;

    if (!schoolId || !title || !body) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Get device tokens
    const tokens = await getDeviceTokensForSchool(schoolId, roles);
    
    if (tokens.length === 0) {
      return { success: false, message: 'No device tokens found' };
    }

    // Send notification
    const notification = { title, body };
    await sendPushNotification(tokens, notification, notificationData || {});

    return { 
      success: true, 
      message: `Notification sent to ${tokens.length} devices`,
      tokenCount: tokens.length
    };
  } catch (error) {
    console.error('Error in sendCustomNotification:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

/**
 * Clean up old notifications (scheduled function)
 * Runs daily to clean up notifications older than 30 days
 */
exports.cleanupOldNotifications = functions.pubsub
  .schedule('0 2 * * *') // Run daily at 2 AM
  .timeZone('UTC')
  .onRun(async (context) => {
    try {
      console.log('Starting cleanup of old notifications...');
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const batch = db.batch();
      let deletedCount = 0;
      
      // Get all notification collections
      const usersSnapshot = await db.collection('users').get();
      
      for (const userDoc of usersSnapshot.docs) {
        const notificationsSnapshot = await db
          .collection('users')
          .doc(userDoc.id)
          .collection('notifications')
          .where('createdAt', '<', thirtyDaysAgo)
          .get();
        
        notificationsSnapshot.docs.forEach(doc => {
          batch.delete(doc.ref);
          deletedCount++;
        });
      }
      
      await batch.commit();
      console.log(`Cleaned up ${deletedCount} old notifications`);
      
      return { deletedCount };
    } catch (error) {
      console.error('Error in cleanupOldNotifications:', error);
      throw error;
    }
  });

module.exports = {
  sendPushNotification,
  getDeviceTokensForSchool,
  getDeviceTokensForUsers,
  cleanupInvalidTokens,
  saveNotificationToHistory,
};
