#!/usr/bin/env node

/**
 * Create Sample Data for Smart Campus
 * This script populates DynamoDB tables with sample data for testing
 */

const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { PutCommand, DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');

const REGION = 'eu-north-1';
const client = new DynamoDBClient({ region: REGION });
const docClient = DynamoDBDocumentClient.from(client);

// Sample Schools
const sampleSchools = [
  {
    schoolId: 'SCH-2025-A12',
    name: 'Lotus Public School',
    address: '123 Main Street, New Delhi, India',
    phone: '+91-11-2345-6789',
    email: 'info@lotuspublic.edu',
    adminEmail: 'admin@lotuspublic.edu',
    adminName: 'Dr. Rajesh Kumar',
    status: 'active',
    createdAt: new Date().toISOString(),
    logoUrl: 'https://smartcampus-logos-2025.s3.eu-north-1.amazonaws.com/lotus-logo.png'
  },
  {
    schoolId: 'SCH-2025-B45',
    name: 'Sunrise Academy',
    address: '456 Oak Avenue, Mumbai, India',
    phone: '+91-22-8765-4321',
    email: 'info@sunriseacademy.edu',
    adminEmail: 'admin@sunriseacademy.edu',
    adminName: 'Mrs. Priya Sharma',
    status: 'active',
    createdAt: new Date().toISOString(),
    logoUrl: 'https://smartcampus-logos-2025.s3.eu-north-1.amazonaws.com/sunrise-logo.png'
  },
  {
    schoolId: 'SCH001',
    name: 'Smart Campus Demo School',
    address: '789 Demo Street, Bangalore, India',
    phone: '+91-80-1234-5678',
    email: 'info@smartcampusdemo.edu',
    adminEmail: 'admin@school.com',
    adminName: 'Demo Principal',
    status: 'active',
    createdAt: new Date().toISOString(),
    logoUrl: 'https://smartcampus-logos-2025.s3.eu-north-1.amazonaws.com/demo-logo.png'
  }
];

// Sample Users (to be created after Cognito users are added)
const sampleUsers = [
  {
    userId: 'admin-001',
    email: 'admin@smartcampus.com',
    name: 'Super Admin',
    role: 'super_admin',
    schoolId: '',
    phoneNumber: '+91-98765-43210',
    avatarUrl: ''
  },
  {
    userId: 'schooladmin-001',
    email: 'admin@lotuspublic.edu',
    name: 'Dr. Rajesh Kumar',
    role: 'school_admin',
    schoolId: 'SCH-2025-A12',
    phoneNumber: '+91-11-2345-6789',
    avatarUrl: ''
  },
  {
    userId: 'teacher-001',
    email: 'teacher@lotuspublic.edu',
    name: 'Mrs. Anita Verma',
    role: 'teacher',
    schoolId: 'SCH-2025-A12',
    phoneNumber: '+91-98765-11111',
    avatarUrl: ''
  },
  {
    userId: 'parent-001',
    email: 'parent@lotuspublic.edu',
    name: 'Mr. Amit Patel',
    role: 'parent',
    schoolId: 'SCH-2025-A12',
    phoneNumber: '+91-98765-22222',
    avatarUrl: ''
  }
];

// Sample Calendar Events
const sampleCalendarEvents = [
  {
    eventId: 'EVENT-001',
    schoolId: 'SCH-2025-A12',
    eventDate: '2025-10-25',
    title: 'Annual Sports Day',
    description: 'Annual sports day for all grades',
    type: 'event',
    startTime: '09:00',
    endTime: '16:00',
    location: 'School Ground',
    organizer: 'Sports Department'
  },
  {
    eventId: 'EVENT-002',
    schoolId: 'SCH-2025-A12',
    eventDate: '2025-10-30',
    title: 'Parent-Teacher Meeting',
    description: 'Quarterly parent-teacher meeting',
    type: 'meeting',
    startTime: '14:00',
    endTime: '17:00',
    location: 'School Auditorium',
    organizer: 'Administration'
  }
];

async function populateSchools() {
  console.log('📚 Populating Schools table...');
  
  for (const school of sampleSchools) {
    try {
      await docClient.send(new PutCommand({
        TableName: 'SmartCampus-Schools',
        Item: school
      }));
      console.log(`✅ Added school: ${school.name}`);
    } catch (error) {
      console.error(`❌ Error adding school ${school.name}:`, error.message);
    }
  }
}

async function populateUsers() {
  console.log('\n👥 Populating Users table...');
  
  for (const user of sampleUsers) {
    try {
      await docClient.send(new PutCommand({
        TableName: 'SmartCampus-Users',
        Item: user
      }));
      console.log(`✅ Added user: ${user.name}`);
    } catch (error) {
      console.error(`❌ Error adding user ${user.name}:`, error.message);
    }
  }
}

async function populateCalendarEvents() {
  console.log('\n📅 Populating Calendar table...');
  
  for (const event of sampleCalendarEvents) {
    try {
      await docClient.send(new PutCommand({
        TableName: 'SmartCampus-Calendar',
        Item: event
      }));
      console.log(`✅ Added event: ${event.title}`);
    } catch (error) {
      console.error(`❌ Error adding event ${event.title}:`, error.message);
    }
  }
}

async function main() {
  console.log('========================================');
  console.log('🚀 Smart Campus - Sample Data Creation');
  console.log('========================================\n');
  
  try {
    await populateSchools();
    await populateUsers();
    await populateCalendarEvents();
    
    console.log('\n========================================');
    console.log('✅ Sample data created successfully!');
    console.log('========================================\n');
    
    console.log('Next Steps:');
    console.log('1. Create Cognito users using the AWS CLI or Console');
    console.log('2. Update user IDs in the Users table to match Cognito user IDs');
    console.log('3. Test login with the sample credentials');
    console.log('\nSample Login Credentials:');
    console.log('- Super Admin: admin@smartcampus.com / (set in Cognito)');
    console.log('- School Admin: admin@lotuspublic.edu / (set in Cognito)');
    console.log('- Teacher: teacher@lotuspublic.edu / (set in Cognito)');
    console.log('- Parent: parent@lotuspublic.edu / (set in Cognito)');
    console.log('- School ID: SCH-2025-A12 or SCH-2025-B45 or SCH001');
    
  } catch (error) {
    console.error('\n❌ Error creating sample data:', error);
    process.exit(1);
  }
}

main();

