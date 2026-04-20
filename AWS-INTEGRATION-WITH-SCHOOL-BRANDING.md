# 🏫 AWS Integration with School Branding Feature

## 🎯 Feature Overview

**Multi-Tenant School Branding System**

When a Super Admin creates a school:
1. Upload school logo (image)
2. Set school name and details
3. Generate unique school ID
4. Logo appears on:
   - Splash/loading screen (school-specific)
   - All dashboards for that school
   - Login screen (optional)
   - Headers and navigation

Each school has its own branded experience within the same app.

---

## 🏗️ Architecture

### System Flow

```
Super Admin Login
    ↓
Create School Profile
    ↓
Upload School Logo (S3)
    ↓
Save School Data (DynamoDB) with Logo URL
    ↓
Generate Unique School ID
    ↓
Users Login with School ID
    ↓
App Loads School Data (logo, name, colors)
    ↓
Dynamic Branding Applied Throughout App
```

### AWS Services Needed

1. **AWS Cognito** - User authentication
2. **AWS S3** - School logo storage
3. **AWS DynamoDB** - School data storage
4. **AWS AppSync** (optional) - GraphQL API
5. **AWS Lambda** - Business logic
6. **AWS CloudFront** - CDN for fast logo delivery

---

## 📊 Data Models

### School Model (Enhanced)

```typescript
// models/SchoolModel.ts
export interface School {
  // Core Information
  id: string;                    // Auto-generated UUID
  schoolId: string;              // Unique format: SCH-2025-A12
  name: string;                  // "Lotus Public School"
  
  // Branding
  logo: {
    url: string;                 // S3 URL: "https://s3...logo.png"
    thumbnailUrl?: string;       // Optimized version
    fileName: string;            // "lotus-public-logo.png"
    fileSize: number;            // In bytes
    uploadedAt: Date;
    uploadedBy: string;          // Admin user ID
  };
  
  // Additional Branding (Optional)
  branding?: {
    primaryColor: string;        // "#3B82F6"
    secondaryColor: string;      // "#1E3A8A"
    accentColor: string;         // "#10B981"
    fontFamily?: string;         // Custom font
  };
  
  // School Details
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  
  // Admin Information
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  
  // Status
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  subscription: {
    plan: 'free' | 'basic' | 'premium' | 'enterprise';
    validUntil: Date;
    features: string[];
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;             // Super admin user ID
  
  // Statistics
  stats?: {
    totalStudents: number;
    totalTeachers: number;
    totalParents: number;
    totalStaff: number;
  };
}
```

### User Model (Enhanced)

```typescript
// models/UserModel.ts
export interface User {
  id: string;                    // Cognito user ID
  email: string;
  name: string;
  role: 'super_admin' | 'school_admin' | 'teacher' | 'parent' | 'student';
  
  // School Association
  schoolId: string;              // Links to School.schoolId
  schoolData?: {                 // Cached for performance
    name: string;
    logo: string;                // Logo URL
    primaryColor: string;
  };
  
  // Profile
  profilePicture?: string;
  phone?: string;
  
  // Timestamps
  createdAt: Date;
  lastLogin: Date;
}
```

---

## 🗄️ AWS DynamoDB Tables

### Table 1: Schools

```javascript
{
  TableName: "Schools",
  KeySchema: [
    { AttributeName: "schoolId", KeyType: "HASH" }  // Partition key
  ],
  AttributeDefinitions: [
    { AttributeName: "schoolId", AttributeType: "S" },
    { AttributeName: "status", AttributeType: "S" },
    { AttributeName: "createdAt", AttributeType: "S" }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "StatusIndex",
      KeySchema: [
        { AttributeName: "status", KeyType: "HASH" },
        { AttributeName: "createdAt", KeyType: "RANGE" }
      ]
    }
  ]
}
```

**Example Item:**
```json
{
  "schoolId": "SCH-2025-A12",
  "id": "uuid-123",
  "name": "Lotus Public School",
  "logo": {
    "url": "https://smart-campus-logos.s3.amazonaws.com/schools/SCH-2025-A12/logo.png",
    "thumbnailUrl": "https://smart-campus-logos.s3.amazonaws.com/schools/SCH-2025-A12/logo_thumb.png",
    "fileName": "lotus-logo.png",
    "fileSize": 245678,
    "uploadedAt": "2025-10-13T10:00:00Z"
  },
  "branding": {
    "primaryColor": "#3B82F6",
    "secondaryColor": "#1E3A8A"
  },
  "status": "active",
  "createdAt": "2025-01-01T00:00:00Z"
}
```

### Table 2: Users

```javascript
{
  TableName: "Users",
  KeySchema: [
    { AttributeName: "id", KeyType: "HASH" }  // Cognito user ID
  ],
  AttributeDefinitions: [
    { AttributeName: "id", AttributeType: "S" },
    { AttributeName: "schoolId", AttributeType: "S" },
    { AttributeName: "role", AttributeType: "S" }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "SchoolIndex",
      KeySchema: [
        { AttributeName: "schoolId", KeyType: "HASH" },
        { AttributeName: "role", KeyType: "RANGE" }
      ]
    }
  ]
}
```

---

## 📦 AWS S3 Bucket Structure

### Bucket: `smart-campus-assets`

```
smart-campus-assets/
├── schools/
│   ├── SCH-2025-A12/
│   │   ├── logo.png                 # Original logo
│   │   ├── logo_thumb.png           # Thumbnail (200x200)
│   │   ├── logo_small.png           # Small (64x64)
│   │   └── documents/
│   │       └── ...
│   ├── SCH-2025-B45/
│   │   └── ...
│   └── SCH-2025-C78/
│       └── ...
├── users/
│   ├── {userId}/
│   │   └── profile.jpg
│   └── ...
└── uploads/
    └── temp/                        # Temporary uploads
```

### S3 Bucket Policy

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicReadSchoolLogos",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::smart-campus-assets/schools/*/logo*.png"
    },
    {
      "Sid": "AuthenticatedUpload",
      "Effect": "Allow",
      "Principal": {
        "AWS": "arn:aws:iam::ACCOUNT_ID:role/CognitoAuthRole"
      },
      "Action": [
        "s3:PutObject",
        "s3:DeleteObject"
      ],
      "Resource": "arn:aws:s3:::smart-campus-assets/*"
    }
  ]
}
```

---

## 🔐 AWS Cognito Setup

### User Pool Configuration

```javascript
{
  UserPoolName: "SmartCampusUsers",
  Policies: {
    PasswordPolicy: {
      MinimumLength: 8,
      RequireUppercase: true,
      RequireLowercase: true,
      RequireNumbers: true,
      RequireSymbols: true
    }
  },
  Schema: [
    {
      Name: "email",
      Required: true,
      Mutable: false
    },
    {
      Name: "name",
      Required: true,
      Mutable: true
    },
    {
      Name: "custom:role",
      AttributeDataType: "String",
      Mutable: true
    },
    {
      Name: "custom:schoolId",
      AttributeDataType: "String",
      Mutable: true
    }
  ]
}
```

---

## 🛠️ Implementation Steps

### Phase 1: AWS Infrastructure Setup (2-3 hours)

#### Step 1.1: Install AWS Amplify

```bash
cd SmartCampusMobile

# Install Amplify CLI
npm install -g @aws-amplify/cli

# Configure Amplify
amplify configure

# Initialize project
amplify init
```

**Amplify Configuration:**
```
? Enter a name for the project: SmartCampus
? Enter a name for the environment: dev
? Choose your default editor: Visual Studio Code
? Choose the type of app: javascript
? What javascript framework: react-native
? Source Directory Path: src
? Distribution Directory Path: /
? Build Command: npm run build
? Start Command: npm start
```

#### Step 1.2: Add Authentication

```bash
amplify add auth

# Configuration:
# - Do you want to use the default authentication? Manual configuration
# - How do you want users to be able to sign in? Email
# - Do you want to configure advanced settings? Yes
# - What attributes are required for signing up? Email, Name
# - Do you want to add custom attributes? Yes
#   - custom:role (String)
#   - custom:schoolId (String)
```

#### Step 1.3: Add Storage (S3)

```bash
amplify add storage

# Configuration:
# - Select from one of the below mentioned services: Content (Images, audio, video, etc.)
# - Provide a friendly name: schoolAssets
# - Provide bucket name: smartcampusassets
# - Who should have access: Auth users only
# - What kind of access: create/update, read, delete
# - Do you want to add a Lambda Trigger? No
```

#### Step 1.4: Add API (DynamoDB)

```bash
amplify add api

# Configuration:
# - Select from one of the below: GraphQL
# - Provide API name: SmartCampusAPI
# - Choose the default authorization type: Amazon Cognito User Pool
# - Do you want to configure advanced settings? Yes
# - Configure additional auth types? Yes
#   - API key (for public access to school info)
# - Do you have an annotated GraphQL schema? No
# - Choose a schema template: Single object with fields
# - Do you want to edit the schema now? Yes
```

**GraphQL Schema** (`amplify/backend/api/SmartCampusAPI/schema.graphql`):

```graphql
type School @model @auth(rules: [
  { allow: private, operations: [read] },
  { allow: groups, groups: ["SuperAdmin"], operations: [create, update, delete, read] }
]) {
  id: ID!
  schoolId: String! @index(name: "bySchoolId", queryField: "schoolBySchoolId")
  name: String!
  logo: LogoInfo!
  branding: BrandingInfo
  address: String!
  city: String!
  state: String!
  zipCode: String!
  country: String!
  phone: String!
  email: String!
  website: String
  adminName: String!
  adminEmail: String!
  adminPhone: String!
  status: SchoolStatus!
  subscription: SubscriptionInfo!
  stats: SchoolStats
  createdAt: AWSDateTime!
  updatedAt: AWSDateTime!
  createdBy: String!
}

type LogoInfo {
  url: String!
  thumbnailUrl: String
  fileName: String!
  fileSize: Int!
  uploadedAt: AWSDateTime!
  uploadedBy: String!
}

type BrandingInfo {
  primaryColor: String!
  secondaryColor: String!
  accentColor: String!
  fontFamily: String
}

enum SchoolStatus {
  ACTIVE
  INACTIVE
  PENDING
  SUSPENDED
}

type SubscriptionInfo {
  plan: SubscriptionPlan!
  validUntil: AWSDateTime!
  features: [String!]!
}

enum SubscriptionPlan {
  FREE
  BASIC
  PREMIUM
  ENTERPRISE
}

type SchoolStats {
  totalStudents: Int!
  totalTeachers: Int!
  totalParents: Int!
  totalStaff: Int!
}

type User @model @auth(rules: [
  { allow: owner },
  { allow: groups, groups: ["SuperAdmin", "SchoolAdmin"], operations: [read, update] }
]) {
  id: ID!
  email: String!
  name: String!
  role: UserRole!
  schoolId: String! @index(name: "bySchool", queryField: "usersBySchool")
  schoolData: CachedSchoolData
  profilePicture: String
  phone: String
  createdAt: AWSDateTime!
  lastLogin: AWSDateTime
}

enum UserRole {
  SUPER_ADMIN
  SCHOOL_ADMIN
  TEACHER
  PARENT
  STUDENT
}

type CachedSchoolData {
  name: String!
  logo: String!
  primaryColor: String!
}
```

#### Step 1.5: Deploy Everything

```bash
amplify push

# This will:
# - Create Cognito User Pool
# - Create S3 bucket
# - Create DynamoDB tables
# - Create AppSync GraphQL API
# - Generate AWS configuration files
```

---

### Phase 2: Service Implementation (3-4 hours)

#### File: `services/AWSSchoolService.ts`

```typescript
import { Storage, API, graphqlOperation } from 'aws-amplify';
import { v4 as uuidv4 } from 'uuid';
import { School, LogoInfo } from '../models/SchoolModel';

// GraphQL mutations and queries
const createSchool = /* GraphQL */ `
  mutation CreateSchool($input: CreateSchoolInput!) {
    createSchool(input: $input) {
      id
      schoolId
      name
      logo {
        url
        thumbnailUrl
        fileName
      }
      status
    }
  }
`;

const getSchoolBySchoolId = /* GraphQL */ `
  query GetSchoolBySchoolId($schoolId: String!) {
    schoolBySchoolId(schoolId: $schoolId) {
      items {
        id
        schoolId
        name
        logo {
          url
          thumbnailUrl
          fileName
        }
        branding {
          primaryColor
          secondaryColor
          accentColor
        }
        status
      }
    }
  }
`;

export class AWSSchoolService {
  /**
   * Upload school logo to S3
   */
  static async uploadSchoolLogo(
    schoolId: string,
    file: File | Blob,
    fileName: string
  ): Promise<LogoInfo> {
    try {
      // Generate unique filename
      const fileExtension = fileName.split('.').pop();
      const uniqueFileName = `logo.${fileExtension}`;
      const s3Key = `schools/${schoolId}/${uniqueFileName}`;
      
      // Upload original
      const uploadResult = await Storage.put(s3Key, file, {
        contentType: file.type || 'image/png',
        level: 'public',
        metadata: {
          schoolId: schoolId,
          uploadedAt: new Date().toISOString()
        }
      });
      
      // Get public URL
      const logoUrl = await Storage.get(s3Key, { level: 'public' });
      
      // TODO: Generate thumbnail (can use Lambda function)
      // For now, use same URL
      const thumbnailUrl = logoUrl;
      
      return {
        url: logoUrl as string,
        thumbnailUrl: thumbnailUrl as string,
        fileName: uniqueFileName,
        fileSize: file.size,
        uploadedAt: new Date(),
        uploadedBy: 'current-user-id' // Get from Cognito
      };
    } catch (error) {
      console.error('Error uploading logo:', error);
      throw new Error('Failed to upload school logo');
    }
  }
  
  /**
   * Create new school
   */
  static async createSchool(schoolData: {
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    phone: string;
    email: string;
    adminName: string;
    adminEmail: string;
    adminPhone: string;
    logoFile: File | Blob;
    logoFileName: string;
    branding?: {
      primaryColor: string;
      secondaryColor: string;
      accentColor: string;
    };
  }): Promise<School> {
    try {
      // Generate unique school ID
      const schoolId = this.generateSchoolId();
      
      // Upload logo first
      const logoInfo = await this.uploadSchoolLogo(
        schoolId,
        schoolData.logoFile,
        schoolData.logoFileName
      );
      
      // Create school record
      const input = {
        schoolId,
        name: schoolData.name,
        logo: logoInfo,
        branding: schoolData.branding || {
          primaryColor: '#3B82F6',
          secondaryColor: '#1E3A8A',
          accentColor: '#10B981'
        },
        address: schoolData.address,
        city: schoolData.city,
        state: schoolData.state,
        zipCode: schoolData.zipCode,
        country: schoolData.country,
        phone: schoolData.phone,
        email: schoolData.email,
        adminName: schoolData.adminName,
        adminEmail: schoolData.adminEmail,
        adminPhone: schoolData.adminPhone,
        status: 'ACTIVE',
        subscription: {
          plan: 'BASIC',
          validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          features: ['attendance', 'homework', 'communication']
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: 'current-user-id' // Get from Cognito
      };
      
      const result: any = await API.graphql(
        graphqlOperation(createSchool, { input })
      );
      
      return result.data.createSchool;
    } catch (error) {
      console.error('Error creating school:', error);
      throw new Error('Failed to create school');
    }
  }
  
  /**
   * Get school by school ID
   */
  static async getSchoolBySchoolId(schoolId: string): Promise<School | null> {
    try {
      const result: any = await API.graphql(
        graphqlOperation(getSchoolBySchoolId, { schoolId })
      );
      
      const items = result.data.schoolBySchoolId.items;
      return items.length > 0 ? items[0] : null;
    } catch (error) {
      console.error('Error fetching school:', error);
      return null;
    }
  }
  
  /**
   * Generate unique school ID
   */
  static generateSchoolId(): string {
    const year = new Date().getFullYear();
    const randomLetter = String.fromCharCode(65 + Math.floor(Math.random() * 26)); // A-Z
    const randomNumber = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    return `SCH-${year}-${randomLetter}${randomNumber}`;
  }
  
  /**
   * Cache school data in AsyncStorage for offline access
   */
  static async cacheSchoolData(schoolId: string, schoolData: School): Promise<void> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem(
        `school_${schoolId}`,
        JSON.stringify(schoolData)
      );
    } catch (error) {
      console.error('Error caching school data:', error);
    }
  }
  
  /**
   * Get cached school data
   */
  static async getCachedSchoolData(schoolId: string): Promise<School | null> {
    try {
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      const data = await AsyncStorage.default.getItem(`school_${schoolId}`);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Error getting cached school data:', error);
      return null;
    }
  }
}
```

---

### Phase 3: UI Implementation (2-3 hours)

#### Screen: `screens/SuperAdminCreateSchool.tsx`

```typescript
import React, { useState } from 'react';
import { ScrollView, Image, Alert, Platform } from 'react-native';
import { Box, Text, Button, Input } from '@gluestack-ui/themed';
import * as ImagePicker from 'expo-image-picker';
import { Upload, Building, MapPin, Phone, Mail, User } from 'lucide-react-native';
import { AnimatedCard } from '../components/ui/AnimatedCard';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { AWSSchoolService } from '../services/AWSSchoolService';

const SuperAdminCreateSchool = ({ navigation }) => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    phone: '',
    email: '',
    adminName: '',
    adminEmail: '',
    adminPhone: '',
  });
  
  const [logo, setLogo] = useState<{
    uri: string;
    file: File | Blob;
    fileName: string;
  } | null>(null);
  
  const [loading, setLoading] = useState(false);
  
  // Pick logo image
  const pickLogo = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please grant camera roll permissions');
        return;
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });
      
      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Convert to Blob for upload
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        
        setLogo({
          uri: asset.uri,
          file: blob,
          fileName: `logo_${Date.now()}.jpg`
        });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to pick image');
    }
  };
  
  // Create school
  const handleCreateSchool = async () => {
    try {
      // Validation
      if (!formData.name || !formData.email || !logo) {
        Alert.alert('Error', 'Please fill all required fields and upload logo');
        return;
      }
      
      setLoading(true);
      
      // Create school with logo
      const school = await AWSSchoolService.createSchool({
        ...formData,
        logoFile: logo.file,
        logoFileName: logo.fileName,
      });
      
      Alert.alert(
        'Success!',
        `School created successfully!\n\nSchool ID: ${school.schoolId}\n\nPlease share this ID with school administrators.`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error creating school:', error);
      Alert.alert('Error', 'Failed to create school. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <ScrollView style={{ flex: 1, backgroundColor: '#F9FAFB' }}>
      <Box padding="$5">
        <Text fontSize="$3xl" fontWeight="$bold" color="$textDark" marginBottom="$2">
          Create New School
        </Text>
        <Text fontSize="$md" color="$textMuted" marginBottom="$6">
          Set up a new school profile with custom branding
        </Text>
        
        {/* Logo Upload */}
        <AnimatedCard variant="elevated" padding="$5" delay={100}>
          <Text fontSize="$lg" fontWeight="$bold" color="$textDark" marginBottom="$4">
            School Logo
          </Text>
          
          {logo ? (
            <Box alignItems="center" marginBottom="$4">
              <Image
                source={{ uri: logo.uri }}
                style={{
                  width: 150,
                  height: 150,
                  borderRadius: 12,
                  marginBottom: 16
                }}
              />
              <Button onPress={pickLogo} variant="outline">
                <Text>Change Logo</Text>
              </Button>
            </Box>
          ) : (
            <AnimatedButton
              variant="outline"
              onPress={pickLogo}
              leftIcon={<Upload size={20} color="#3B82F6" />}
            >
              Upload School Logo
            </AnimatedButton>
          )}
          
          <Text fontSize="$sm" color="$textMuted" marginTop="$2">
            Recommended: Square image, at least 512x512px, PNG or JPG
          </Text>
        </AnimatedCard>
        
        {/* School Information */}
        <AnimatedCard variant="elevated" padding="$5" delay={200} marginTop="$4">
          <Text fontSize="$lg" fontWeight="$bold" color="$textDark" marginBottom="$4">
            School Information
          </Text>
          
          <Box marginBottom="$4">
            <Text fontSize="$sm" color="$textMuted" marginBottom="$2">School Name *</Text>
            <Input
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              placeholder="Lotus Public School"
            />
          </Box>
          
          <Box marginBottom="$4">
            <Text fontSize="$sm" color="$textMuted" marginBottom="$2">Email *</Text>
            <Input
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              placeholder="info@school.com"
              keyboardType="email-address"
            />
          </Box>
          
          <Box marginBottom="$4">
            <Text fontSize="$sm" color="$textMuted" marginBottom="$2">Phone</Text>
            <Input
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              placeholder="+1-555-123-4567"
              keyboardType="phone-pad"
            />
          </Box>
          
          <Box marginBottom="$4">
            <Text fontSize="$sm" color="$textMuted" marginBottom="$2">Address</Text>
            <Input
              value={formData.address}
              onChangeText={(text) => setFormData({ ...formData, address: text })}
              placeholder="123 Main Street"
            />
          </Box>
          
          <Box flexDirection="row" space="md">
            <Box flex={1}>
              <Text fontSize="$sm" color="$textMuted" marginBottom="$2">City</Text>
              <Input
                value={formData.city}
                onChangeText={(text) => setFormData({ ...formData, city: text })}
                placeholder="City"
              />
            </Box>
            <Box flex={1}>
              <Text fontSize="$sm" color="$textMuted" marginBottom="$2">State</Text>
              <Input
                value={formData.state}
                onChangeText={(text) => setFormData({ ...formData, state: text })}
                placeholder="State"
              />
            </Box>
          </Box>
        </AnimatedCard>
        
        {/* Administrator Information */}
        <AnimatedCard variant="elevated" padding="$5" delay="300" marginTop="$4">
          <Text fontSize="$lg" fontWeight="$bold" color="$textDark" marginBottom="$4">
            School Administrator
          </Text>
          
          <Box marginBottom="$4">
            <Text fontSize="$sm" color="$textMuted" marginBottom="$2">Admin Name *</Text>
            <Input
              value={formData.adminName}
              onChangeText={(text) => setFormData({ ...formData, adminName: text })}
              placeholder="John Doe"
            />
          </Box>
          
          <Box marginBottom="$4">
            <Text fontSize="$sm" color="$textMuted" marginBottom="$2">Admin Email *</Text>
            <Input
              value={formData.adminEmail}
              onChangeText={(text) => setFormData({ ...formData, adminEmail: text })}
              placeholder="admin@school.com"
              keyboardType="email-address"
            />
          </Box>
          
          <Box marginBottom="$4">
            <Text fontSize="$sm" color="$textMuted" marginBottom="$2">Admin Phone</Text>
            <Input
              value={formData.adminPhone}
              onChangeText={(text) => setFormData({ ...formData, adminPhone: text })}
              placeholder="+1-555-987-6543"
              keyboardType="phone-pad"
            />
          </Box>
        </AnimatedCard>
        
        {/* Create Button */}
        <AnimatedButton
          variant="primary"
          size="lg"
          onPress={handleCreateSchool}
          disabled={loading}
          marginTop="$6"
          marginBottom="$10"
        >
          {loading ? 'Creating School...' : 'Create School'}
        </AnimatedButton>
      </Box>
    </ScrollView>
  );
};

export default SuperAdminCreateSchool;
```

#### Component: `components/SchoolBrandedHeader.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { Box, Text } from '@gluestack-ui/themed';
import { useAuth } from '../contexts/AuthContext';
import { AWSSchoolService } from '../services/AWSSchoolService';
import { School } from '../models/SchoolModel';

interface SchoolBrandedHeaderProps {
  showLogo?: boolean;
  showName?: boolean;
  logoSize?: number;
}

export const SchoolBrandedHeader: React.FC<SchoolBrandedHeaderProps> = ({
  showLogo = true,
  showName = true,
  logoSize = 40,
}) => {
  const { userData } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    loadSchoolData();
  }, [userData?.schoolId]);
  
  const loadSchoolData = async () => {
    if (!userData?.schoolId) return;
    
    try {
      // Try cache first
      let schoolData = await AWSSchoolService.getCachedSchoolData(userData.schoolId);
      
      if (!schoolData) {
        // Fetch from API
        schoolData = await AWSSchoolService.getSchoolBySchoolId(userData.schoolId);
        
        if (schoolData) {
          // Cache for future use
          await AWSSchoolService.cacheSchoolData(userData.schoolId, schoolData);
        }
      }
      
      setSchool(schoolData);
    } catch (error) {
      console.error('Error loading school data:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading || !school) {
    return null;
  }
  
  return (
    <Box flexDirection="row" alignItems="center" space="sm">
      {showLogo && school.logo?.url && (
        <Image
          source={{ uri: school.logo.thumbnailUrl || school.logo.url }}
          style={{
            width: logoSize,
            height: logoSize,
            borderRadius: logoSize / 8,
          }}
        />
      )}
      {showName && (
        <Text
          fontSize="$lg"
          fontWeight="$bold"
          color="$white"
        >
          {school.name}
        </Text>
      )}
    </Box>
  );
};
```

#### Updated: `screens/ProductionSplashScreen.tsx`

```typescript
import React, { useEffect, useState } from 'react';
import { Image } from 'react-native';
import { Box, Text } from '@gluestack-ui/themed';
import { MotiView } from 'moti';
import { School as SchoolIcon } from 'lucide-react-native';
import { GradientBox } from '../components/ui/GradientBox';
import { useAuth } from '../contexts/AuthContext';
import { AWSSchoolService } from '../services/AWSSchoolService';
import { School } from '../models/SchoolModel';

const ProductionSplashScreen: React.FC = () => {
  const { userData } = useAuth();
  const [school, setSchool] = useState<School | null>(null);
  
  useEffect(() => {
    loadSchoolBranding();
  }, [userData?.schoolId]);
  
  const loadSchoolBranding = async () => {
    if (!userData?.schoolId) return;
    
    try {
      const schoolData = await AWSSchoolService.getCachedSchoolData(userData.schoolId);
      setSchool(schoolData);
    } catch (error) {
      console.error('Error loading school branding:', error);
    }
  };
  
  // Use school branding colors if available
  const gradientColors = school?.branding
    ? [school.branding.primaryColor, school.branding.secondaryColor]
    : ['#3B82F6', '#1E3A8A'];
  
  return (
    <GradientBox colors={gradientColors}>
      <Box flex={1} justifyContent="center" alignItems="center" padding="$8">
        {/* School Logo or Default Icon */}
        <MotiView
          from={{ scale: 0.5, opacity: 0, rotate: '-180deg' }}
          animate={{ scale: 1, opacity: 1, rotate: '0deg' }}
          transition={{ type: 'spring', damping: 15, stiffness: 100 }}
        >
          <Box
            width={140}
            height={140}
            borderRadius="$full"
            bg="rgba(255, 255, 255, 0.2)"
            borderWidth={4}
            borderColor="rgba(255, 255, 255, 0.4)"
            justifyContent="center"
            alignItems="center"
            overflow="hidden"
          >
            {school?.logo?.url ? (
              <Image
                source={{ uri: school.logo.thumbnailUrl || school.logo.url }}
                style={{ width: 100, height: 100, borderRadius: 50 }}
              />
            ) : (
              <SchoolIcon size={64} color="#FFFFFF" strokeWidth={2} />
            )}
          </Box>
        </MotiView>
        
        {/* School Name or App Name */}
        <MotiView
          from={{ opacity: 0, translateY: 30 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 800, delay: 400 }}
        >
          <Text
            fontSize="$5xl"
            fontWeight="$bold"
            color="$white"
            marginTop="$8"
            textAlign="center"
          >
            {school?.name || 'Smart Campus'}
          </Text>
        </MotiView>
        
        {/* Tagline */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: 'timing', duration: 800, delay: 800 }}
        >
          <Text
            fontSize="$lg"
            color="rgba(255, 255, 255, 0.9)"
            marginTop="$3"
            textAlign="center"
          >
            School Management System
          </Text>
        </MotiView>
        
        {/* Loading Indicator */}
        <MotiView
          from={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{
            type: 'timing',
            duration: 600,
            delay: 1200,
            loop: true,
          }}
          style={{ position: 'absolute', bottom: 100 }}
        >
          <Box flexDirection="row" space="sm">
            {[0, 1, 2].map((index) => (
              <MotiView
                key={index}
                from={{ translateY: 0 }}
                animate={{ translateY: -10 }}
                transition={{
                  type: 'timing',
                  duration: 600,
                  delay: index * 200,
                  loop: true,
                  repeatReverse: true,
                }}
              >
                <Box
                  width={12}
                  height={12}
                  borderRadius="$full"
                  bg="rgba(255, 255, 255, 0.8)"
                />
              </MotiView>
            ))}
          </Box>
        </MotiView>
      </Box>
    </GradientBox>
  );
};

export default ProductionSplashScreen;
```

---

## 📦 Required Dependencies

```bash
# Install additional dependencies
npm install aws-amplify @aws-amplify/ui-react-native amazon-cognito-identity-js
npm install expo-image-picker
npm install @react-native-async-storage/async-storage
npm install uuid
npm install --save-dev @types/uuid
```

Update `package.json`:
```json
{
  "dependencies": {
    "aws-amplify": "^6.0.0",
    "@aws-amplify/ui-react-native": "^2.0.0",
    "amazon-cognito-identity-js": "^6.3.0",
    "expo-image-picker": "~15.0.0",
    "@react-native-async-storage/async-storage": "^1.21.0",
    "uuid": "^9.0.1"
  }
}
```

---

## 🔄 Migration from Mock to Real

### Update `App.tsx`

```typescript
import { Amplify } from 'aws-amplify';
import awsconfig from './src/aws-exports';

// Configure Amplify
Amplify.configure(awsconfig);

// Rest of your app...
```

### Update `AuthContext.tsx`

Replace mock authentication with Cognito:

```typescript
import { Auth } from 'aws-amplify';

// In login function:
const user = await Auth.signIn(email, password);
const attributes = await Auth.userAttributes(user);
```

---

## 💰 AWS Cost Estimate for School Branding

### Monthly Costs (10k users, 50 schools)

| Service | Usage | Cost |
|---------|-------|------|
| **S3 Storage** | 50 schools × 1MB logos = 50MB | $0.001 |
| **S3 Requests** | 10k reads/month | $0.004 |
| **CloudFront CDN** | 10GB transfer | $0.85 |
| **Cognito** | 10k MAU | $50.00 |
| **DynamoDB** | 50 schools, light reads | $1.00 |
| **AppSync API** | 100k queries/month | $4.00 |
| **Lambda** | Image processing | $0.20 |
| **TOTAL** | | **~$56.05** |

**Note:** Logo storage and delivery adds minimal cost (~$1/month)

---

## ✅ Testing Checklist

- [ ] Super admin can create school
- [ ] Logo uploads to S3 successfully
- [ ] School data saves to DynamoDB
- [ ] Unique school ID generates correctly
- [ ] Logo appears on splash screen
- [ ] Logo appears on dashboards
- [ ] School name displays correctly
- [ ] Branding colors apply (if configured)
- [ ] Users can login with school ID
- [ ] Cached school data works offline
- [ ] Multiple schools work independently

---

## 🎯 Summary

**What This Achieves:**

1. ✅ Super Admin creates schools with custom logos
2. ✅ Each school gets unique ID (SCH-2025-A12)
3. ✅ Logos stored in S3, served via CloudFront CDN
4. ✅ School data in DynamoDB with GraphQL API
5. ✅ Dynamic splash screen shows school logo
6. ✅ All dashboards show school branding
7. ✅ Offline caching for performance
8. ✅ Multi-tenant architecture ready

**Estimated Implementation Time:** 8-10 hours
**AWS Cost:** ~$56/month for 10k users, 50 schools

Ready to begin implementation! 🚀

