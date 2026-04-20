# 🎓 Smart Campus Mobile App

A comprehensive school management mobile application built with React Native, Expo, and AWS.

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Deploy AWS infrastructure (one-time)
cd cloudformation && ./deploy-all.sh

# 3. Initialize EAS (one-time)
eas login
eas init

# 4. Start development
npm start
```

## 📱 Features

- **Multi-Role Authentication** - Super Admin, School Admin, Teacher, Parent, Student
- **School Management** - Create and manage multiple schools
- **Attendance Tracking** - Mark and monitor student attendance
- **Homework Management** - Assign and track homework
- **Fee Management** - Track and manage school fees
- **Communication** - In-app messaging and announcements
- **Transport Tracking** - School bus tracking and management
- **Gallery** - School events and photos
- **Calendar** - School events and holidays
- **Analytics** - Comprehensive dashboards for all roles

## 🏗️ Tech Stack

- **Frontend**: React Native, Expo
- **Backend**: AWS (Cognito, DynamoDB, S3)
- **Authentication**: AWS Cognito with custom user attributes
- **Database**: Amazon DynamoDB
- **Storage**: Amazon S3
- **Build & Deploy**: EAS (Expo Application Services)

## 📚 Documentation

### Setup & Deployment
- **[Setup Instructions](SETUP_INSTRUCTIONS.md)** - Complete setup walkthrough
- **[AWS Setup Guide](AWS_SETUP_GUIDE.md)** - AWS infrastructure setup
- **[App Store Deployment](APP_STORE_DEPLOYMENT_GUIDE.md)** - Store submission guide
- **[Deployment README](DEPLOYMENT_README.md)** - Quick reference
- **[Deployment Summary](DEPLOYMENT_SUMMARY.md)** - What's been configured

### Development
- **[Design System](DESIGN_SYSTEM.md)** - UI/UX guidelines
- **[Gluestack Design](GLUESTACK_DESIGN_SYSTEM.md)** - Component library
- **[Visual Guide](VISUAL_GUIDE.md)** - Visual components reference

## 🔧 Configuration

### AWS Resources

The app uses these AWS services:

**Cognito**
- User Pool ID: `eu-north-1_JrEsAN4go`
- Client ID: `10cj3uqk2ragh21t73gn4513pa`
- Region: `eu-north-1`

**DynamoDB Tables**
- SmartCampus-Schools
- SmartCampus-Users
- SmartCampus-Attendance
- SmartCampus-Homework
- SmartCampus-Fees
- SmartCampus-Communications
- SmartCampus-Notifications
- SmartCampus-Transport
- SmartCampus-Gallery
- SmartCampus-Calendar
- SmartCampus-Analytics

**S3 Storage**
- Bucket: `smartcampus-logos-2025`

### App Configuration

**iOS**
- Bundle ID: `com.smartcampus.mobile`
- Minimum iOS: 13.0

**Android**
- Package: `com.smartcampus.mobile`
- Target SDK: 34

## 🛠️ Development Commands

```bash
# Start development server
npm start

# Run on platforms
npm run ios        # iOS simulator (macOS only)
npm run android    # Android emulator
npm run web        # Web browser

# Type checking
npm run type-check
```

## 🏗️ Build Commands

```bash
# Development builds
npm run build:ios:dev
npm run build:android:dev

# Preview builds (internal testing)
npm run build:ios:preview
npm run build:android:preview

# Production builds
npm run build:ios:prod
npm run build:android:prod
npm run build:all
```

## 🚀 Deployment Commands

```bash
# Deploy to app stores
npm run deploy:ios        # iOS App Store
npm run deploy:android    # Google Play Store
npm run deploy:all        # Both stores

# Submit builds
npm run submit:ios
npm run submit:android
npm run submit:all

# OTA updates (JavaScript only)
npm run update:prod
npm run update:staging
```

## 🔐 Test Credentials

For development and testing:

**Super Admin**
- Email: `admin@smartcampus.com`
- School ID: Not required

**Teacher**
- Email: `teacher@smartcampus.com`
- School ID: `SCH001`

**Parent**
- Email: `parent@smartcampus.com`
- School ID: `SCH001`

**Default Password**: `TempPass123!` (must be changed on first login)

## 📁 Project Structure

```
SmartCampusMobile/
├── assets/              # Images, icons, fonts
├── cloudformation/      # AWS CloudFormation templates
├── components/          # React components
│   ├── ui/             # UI components
│   ├── EnhancedUI/     # Enhanced components
│   └── shadcn/         # shadcn components
├── contexts/           # React contexts
├── models/             # Data models
├── navigation/         # Navigation configuration
├── screens/            # App screens
├── scripts/            # Deployment scripts
├── services/           # API services
│   └── AWSAuthService.ts  # AWS Cognito auth
├── src/                # Source files
│   └── aws-config.ts   # AWS configuration
├── theme/              # Theme configuration
├── app.json            # Expo configuration
├── eas.json            # EAS Build configuration
└── package.json        # Dependencies
```

## 🔑 Environment Variables

Copy `.env.example` to `.env` and update:

```env
AWS_REGION=eu-north-1
AWS_USER_POOL_ID=your-user-pool-id
AWS_USER_POOL_CLIENT_ID=your-client-id
EXPO_PROJECT_ID=your-project-id
```

## 🧪 Testing

### Local Testing
```bash
npm run ios
npm run android
```

### Development Build
```bash
npm run build:android:dev
# Install on device via Expo Go or direct install
```

### Preview Build
```bash
npm run build:ios:preview    # For TestFlight
npm run build:android:preview # For internal testing
```

## 🚢 Deployment Pipeline

### 1. AWS Setup (One-time)
```bash
cd cloudformation
./deploy-all.sh
```

### 2. EAS Setup (One-time)
```bash
eas login
eas init
eas credentials
```

### 3. Deploy to Stores
```bash
npm run deploy:all
```

## 📊 Monitoring

### Build Status
```bash
eas build:list
eas build:view [BUILD_ID]
```

### Logs
```bash
eas logs --platform ios
eas logs --platform android
```

### Analytics
- iOS: App Store Connect
- Android: Google Play Console

## 🆘 Troubleshooting

### Build Issues
```bash
eas build --platform ios --clear-cache
```

### Credential Issues
```bash
eas credentials
# Select platform → Remove → Generate new
```

### AWS Issues
```bash
aws cloudformation describe-stacks --region eu-north-1
```

## 📦 Key Dependencies

- `expo` - Expo framework
- `react-native` - React Native
- `aws-amplify` - AWS integration
- `@aws-sdk/client-*` - AWS SDK
- `@gluestack-ui/themed` - UI components
- `@react-navigation/*` - Navigation

## 🔒 Security

- ✅ AWS Cognito authentication
- ✅ Role-based access control
- ✅ Secure credential storage
- ✅ HTTPS/TLS encryption
- ✅ Environment variable protection

## 📈 Roadmap

- [x] AWS integration
- [x] Multi-role authentication
- [x] School management
- [x] Attendance tracking
- [x] Homework management
- [x] Communication features
- [x] Transport tracking
- [x] Gallery & Calendar
- [x] Analytics dashboards
- [x] App store deployment
- [ ] Push notifications
- [ ] Offline mode
- [ ] Advanced analytics
- [ ] Video conferencing
- [ ] AI-powered insights

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

Proprietary - All rights reserved

## 👥 Support

- **Email**: support@smartcampus.com
- **Documentation**: See guides above
- **Expo Discord**: https://chat.expo.dev/
- **AWS Support**: https://aws.amazon.com/support/

## 🎉 Ready to Deploy?

1. ✅ Read [SETUP_INSTRUCTIONS.md](SETUP_INSTRUCTIONS.md)
2. ✅ Follow [AWS_SETUP_GUIDE.md](AWS_SETUP_GUIDE.md)
3. ✅ Deploy with [APP_STORE_DEPLOYMENT_GUIDE.md](APP_STORE_DEPLOYMENT_GUIDE.md)
4. 🚀 Run `npm run deploy:all`

---

**Built with ❤️ for modern education**

**Version**: 1.0.0  
**Status**: Production Ready 🚀
