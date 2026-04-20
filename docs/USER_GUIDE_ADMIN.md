# Smart Campus - Admin User Guide

## Table of Contents
1. [Getting Started](#getting-started)
2. [Dashboard Overview](#dashboard-overview)
3. [User Management](#user-management)
4. [Analytics & Reports](#analytics--reports)
5. [School Settings](#school-settings)
6. [Send Announcements](#send-announcements)
7. [Manage Calendar](#manage-calendar)
8. [Transport Management](#transport-management)
9. [Fee Management](#fee-management)
10. [System Settings](#system-settings)

---

## Getting Started

### Admin Access

**Who gets admin access:**
- Principal
- Vice Principal
- School Administrator
- Super Admin (multi-school)

### First Login

1. Use credentials provided by system administrator
2. Login at: app or web.smartcampus.com
3. Change password on first login
4. Setup 2-factor authentication (recommended)

### Admin Dashboard

**Your control center for:**
- User management
- School configuration
- Analytics and reports
- System-wide announcements
- Fee management
- Transport coordination

---

## Dashboard Overview

### Key Metrics

**📊 Statistics at a Glance:**
- **Total Students**: Current enrollment
- **Staff Members**: Teachers + support staff
- **Fees Collected**: Monthly collection
- **Attendance Rate**: School-wide average

**📈 School Performance:**
- Academic performance metrics
- Attendance trends
- Financial overview
- Recent activities

**🎯 Quick Actions:**
- Add new user
- Send announcement
- View reports
- Manage classes
- System settings

### Recent Activities

**Monitor all actions:**
- User logins
- Data changes
- System updates
- Important events

**Filter activities by:**
- Date range
- User role
- Action type
- Resource

---

## User Management

### Add New User

**Create Teacher:**

1. Go to "Users" → "Add User"
2. Select role: **Teacher**
3. Fill in details:
   - Full name
   - Email address
   - Phone number
   - Assign to classes
   - Subject specialization
4. Tap "Create User"
5. Temporary password generated automatically
6. Credentials sent to teacher's email

**Create Parent:**

1. Select role: **Parent**
2. Fill in details:
   - Full name
   - Email address
   - Phone number
3. **Link to Student**:
   - Search and select student
   - Set relationship (Father, Mother, Guardian)
   - Mark as primary contact
4. Create account

**Create Student:**

1. Select role: **Student**
2. Fill in details:
   - Full name
   - Email (optional)
   - Roll number
   - Class and section
   - Date of birth
   - Parent email (to auto-link)
3. Upload photo (optional)
4. Create student profile

**Create Staff:**

Roles available:
- Office Staff
- Bus Helper
- Librarian
- Lab Assistant

### Bulk Import Users

**Import from Excel/CSV:**

1. Go to Users → "Bulk Import"

2. **Download Template**
   - Tap "Download CSV Template"
   - Open in Excel/Sheets
   - Fill in user details

3. **CSV Format:**
   ```csv
   email,name,phone,role,classId
   teacher1@school.com,John Doe,+1234567890,TEACHER,class-1
   parent1@school.com,Jane Smith,+1234567891,PARENT,
   student1@school.com,Alice Johnson,+1234567892,STUDENT,class-1
   ```

4. **Upload CSV**
   - Select file
   - Choose role (if all same role)
   - Tap "Import"
   - Review import summary
   - Errors shown for invalid rows

5. **Post-Import**
   - Check import report
   - Fix any failed imports
   - Send credentials to users

### Manage Existing Users

**Search Users:**
- By name
- By email
- By role
- By class
- By status (Active/Inactive)

**Edit User:**
1. Find user in list
2. Tap user name
3. Modify details
4. Update class assignments
5. Save changes

**Deactivate User:**
1. Find user
2. Tap three-dot menu → "Deactivate"
3. Confirm action
4. User account disabled (can be reactivated later)

**Reset Password:**
1. Find user
2. Tap "Reset Password"
3. Temporary password sent to user's email
4. User must change on next login

### User Roles & Permissions

| Role | Permissions |
|------|-------------|
| **SUPER_ADMIN** | Full access to all schools |
| **ADMIN** | Full access to their school |
| **PRINCIPAL** | Full access, view-only for some system settings |
| **TEACHER** | Attendance, Homework, Marks for assigned classes |
| **PARENT** | View own children's data only |
| **STUDENT** | View own data, submit homework |
| **OFFICE_STAFF** | User management, fees, reports |
| **BUS_HELPER** | Transport tracking only |

---

## Analytics & Reports

### Attendance Analytics

**View school-wide attendance:**

1. Go to "Analytics" → "Attendance"

2. **Metrics Available:**
   - Daily attendance rate
   - Weekly trends
   - Class-wise comparison
   - Month-over-month growth
   - Chronic absenteeism alerts

3. **Filters:**
   - Date range
   - Specific class
   - Grade level
   - Status (Present/Absent/Late)

4. **Export:**
   - PDF report
   - Excel spreadsheet
   - CSV for data analysis

### Academic Analytics

**Performance insights:**

1. Go to "Analytics" → "Academic"

2. **Charts:**
   - Average marks by subject
   - Grade distribution
   - Pass/fail rates
   - Top performers
   - Students needing attention

3. **Subject Analysis:**
   - Subject-wise performance
   - Teacher-wise results
   - Improvement trends

### Financial Analytics

**Fee collection overview:**

1. Go to "Analytics" → "Financial"

2. **View:**
   - Total fees collected
   - Pending payments
   - Overdue payments
   - Payment trends
   - Class-wise collection

3. **Reports:**
   - Monthly collection report
   - Defaulter list
   - Payment method breakdown

### Export Reports

**Generate comprehensive reports:**

1. Analytics → "Reports"
2. Select report type:
   - Attendance Report
   - Academic Report
   - Financial Report
   - Custom Report

3. Set parameters:
   - Date range
   - Classes to include
   - Metrics to show

4. Generate and download
5. Schedule automated reports (daily/weekly/monthly)

---

## School Settings

### Basic Information

**Update school details:**
- School name
- Address
- Contact information
- Logo upload
- School code
- Academic year settings

### Class Management

**Create New Class:**
1. Go to "Classes" → "Add Class"
2. Enter:
   - Class name (e.g., "Grade 5A")
   - Grade level
   - Section
   - Capacity
   - Class teacher
3. Save

**Edit Class:**
- Update class teacher
- Change capacity
- Reassign students
- Archive old classes

**Manage Sections:**
- Create multiple sections (A, B, C)
- Assign students to sections
- Balance class sizes

### Subject Management

**Add Subjects:**
1. Go to "Settings" → "Subjects"
2. Add subject:
   - Subject name
   - Subject code
   - Category (Core/Elective)
   - Assigned to grades
3. Assign teachers to subjects

### Academic Calendar

**Configure academic year:**
- Start date
- End date
- Exam schedules
- Holiday list
- Important dates

---

## Send Announcements

### Create Announcement

1. Go to "Announcements" → "➕ New"

2. **Fill in:**
   - Title (clear and concise)
   - Message (detailed information)
   - Priority:
     - 🔴 **Urgent**: Red badge, top of list
     - 🟡 **Important**: Yellow badge
     - ⚪ **Normal**: No badge

3. **Target Audience:**
   - ☑️ All Users
   - ☑️ Parents only
   - ☑️ Teachers only
   - ☑️ Students only
   - ☑️ Specific classes

4. **Schedule** (optional):
   - Send now
   - Schedule for later
   - Recurring announcement

5. **Send**

### View Announcement Status

**Track delivery:**
- Total recipients
- Delivered count
- Read count
- Failed deliveries

### Edit/Delete Announcements

- Edit draft announcements
- Cannot edit sent announcements
- Delete announcements (admin only)

---

## Manage Calendar

### Create School Event

1. Go to "Calendar" → "Add Event"

2. **Event Types:**
   - 🎉 **Holiday**: School holidays
   - 📝 **Exam**: Examination dates
   - 🏆 **Sports**: Sports day, competitions
   - 🤝 **Meeting**: PTM, staff meetings
   - 🎊 **Celebration**: Annual day, festivals

3. **Event Details:**
   - Title and description
   - Start and end date/time
   - Location
   - All-day event toggle
   - Poster image (optional)

4. **Audience:**
   - Who should see this event
   - RSVP required?
   - Maximum attendees

5. **Reminders:**
   - Set reminder timing (1 hour, 1 day, 1 week before)
   - Notification channels (Push, Email, WhatsApp)

6. **Publish Event**

### Manage Events

- Edit upcoming events
- Cancel events (notifies all attendees)
- View RSVP list
- Download attendee list
- Send event reminders

---

## Transport Management

### Manage Routes

**Create New Route:**

1. Go to "Transport" → "Routes" → "Add Route"
2. Enter route details:
   - Route name (e.g., "Route A - North")
   - Route number
   - Morning/Evening route
3. Add stops:
   - Stop name
   - Address
   - GPS coordinates (tap map to select)
   - Estimated time
4. Assign bus helper
5. Save route

**Edit Route:**
- Add/remove stops
- Change sequence
- Update timings
- Reassign helper

**Delete Route:**
- Only if no students assigned
- Archive instead of delete (recommended)

### Assign Students to Routes

1. Go to route details
2. Tap "Assign Students"
3. Select students from list
4. Choose their pickup stop
5. Save assignments
6. Parents receive notification

### Monitor Live Tracking

**View all buses:**
- See all active routes on map
- Real-time location updates
- ETA to stops
- Delay notifications

**Bus Helper Management:**
- Create helper accounts
- Assign to routes
- View tracking history
- Performance reports

---

## Fee Management

### Configure Fee Structure

1. Go to "Fees" → "Fee Structure"

2. **Setup:**
   - Tuition fees (per term/annual)
   - Transport fees
   - Exam fees
   - Other fees (lab, library, etc.)

3. **Set Due Dates:**
   - Monthly installments
   - Termly payments
   - Annual payment

4. **Discounts & Scholarships:**
   - Create discount rules
   - Merit scholarships
   - Sibling discounts

### Track Payments

**Payment Dashboard:**
- Total collected
- Pending payments
- Overdue accounts
- Payment trends

**Defaulter Management:**
- List of overdue accounts
- Send payment reminders
- Generate demand notices
- Follow-up actions

### Generate Fee Reports

- Collection report
- Defaulter list
- Class-wise collection
- Payment method analysis
- Refund reports

---

## System Settings

### General Settings

**Configure:**
- School name and logo
- Academic year
- Default language
- Timezone
- Date format
- Currency

### Security Settings

**Access control:**
- Password policy
- Session timeout
- 2FA requirement
- IP whitelist (optional)

### Notification Settings

**System-wide:**
- Notification templates
- Email server (SMTP)
- SMS gateway
- WhatsApp Business API
- Push notification certificates

### Integration Settings

**Third-party integrations:**
- Google Workspace
- Microsoft 365
- Payment gateways
- SMS providers
- Email services

### Backup & Data

**Data management:**
- Automatic daily backups
- Manual backup trigger
- Data export (all data)
- Data retention policy
- GDPR compliance tools

---

## Advanced Features

### Custom Reports

**Create custom reports:**
1. Analytics → "Custom Report"
2. Select metrics to include
3. Set filters and date range
4. Generate report
5. Save as template for reuse

### Automated Workflows

**Setup automations:**
- Auto-send birthday wishes
- Attendance alerts to parents
- Fee payment reminders
- Exam result publication
- Certificate generation

### API Access

**For developers:**
- Generate API keys
- View API documentation
- Monitor API usage
- Set rate limits

---

## Troubleshooting

### User Can't Login?

**Steps:**
1. Verify user exists in system
2. Check user status (Active/Inactive)
3. Reset password
4. Check email delivery
5. Verify school access

### Data Not Syncing?

**Check:**
- Internet connectivity
- Server status
- Database connection
- Recent updates

### Reports Not Generating?

**Possible causes:**
- Large data set (increase timeout)
- Invalid date range
- Missing data
- Server load

**Solution:**
- Reduce date range
- Generate in smaller batches
- Try during off-peak hours

### Bulk Import Failed?

**Common errors:**
- Invalid CSV format
- Missing required columns
- Duplicate emails
- Invalid data (phone, email)

**Fix:**
- Download and use official template
- Validate data before upload
- Check error report for specific issues

---

## Best Practices

### Daily Tasks (15 minutes)

- ✅ Review dashboard metrics
- ✅ Check pending approvals
- ✅ Respond to support tickets
- ✅ Monitor attendance trends

### Weekly Tasks (1 hour)

- ✅ Review analytics reports
- ✅ Check fee collection status
- ✅ Update calendar events
- ✅ Send weekly announcement
- ✅ Review user accounts
- ✅ Check system performance

### Monthly Tasks (2-3 hours)

- ✅ Generate monthly reports
- ✅ Review staff performance
- ✅ Update academic calendar
- ✅ Financial reconciliation
- ✅ System maintenance
- ✅ Backup verification

### Best Practices for User Management

**Security:**
- Enforce strong password policy
- Enable 2FA for admins
- Regular security audits
- Monitor login activities
- Deactivate unused accounts

**Data Privacy:**
- Limit access to sensitive data
- Regular data exports
- GDPR compliance
- Audit trail maintenance

**Communication:**
- Clear announcement writing
- Timely notifications
- Multi-channel communication
- Feedback collection

---

## Keyboard Shortcuts (Web Version)

- `Ctrl + N` - New user
- `Ctrl + A` - New announcement
- `Ctrl + R` - Refresh data
- `Ctrl + P` - Print report
- `Ctrl + F` - Search
- `Ctrl + /` - Show shortcuts

---

## FAQs

### Q: Can I undo user deletion?
**A:** Users are soft-deleted and can be reactivated. Go to Users → Filters → "Show Inactive" → Reactivate.

### Q: How do I change the academic year?
**A:** Settings → Academic → "New Academic Year" → Follow setup wizard.

### Q: Can I customize the app logo?
**A:** Yes, Settings → Branding → Upload Logo (1024x1024 PNG recommended).

### Q: How do I add a new class?
**A:** Classes → Add Class → Fill details → Assign teacher → Save.

### Q: Can I export all data?
**A:** Yes, Settings → Data Export → Select data type → Generate export → Download.

### Q: How do I handle duplicate users?
**A:** Users → Find duplicate → Merge users → Select primary account → Merge data.

### Q: Can I schedule announcements?
**A:** Yes, when creating announcement, set "Schedule For" date and time.

### Q: How do I track payment defaulters?
**A:** Fees → Defaulters → Set filter criteria → Generate list → Send reminders.

---

## System Administration

### Database Maintenance

**Regular maintenance:**
- Weekly: Check database size
- Monthly: Optimize tables
- Quarterly: Archive old data
- Yearly: Full backup and audit

### User Activity Monitoring

**Monitor:**
- Login attempts (successful/failed)
- Data modifications
- Suspicious activities
- API usage

### Performance Optimization

**Keep system fast:**
- Monitor API response times
- Check database queries
- Optimize image sizes
- Enable caching
- CDN for static files

### Backup & Recovery

**Backup schedule:**
- **Daily**: Automated at 2 AM
- **Weekly**: Full backup on Sunday
- **Monthly**: Archive backup

**Recovery:**
1. Settings → Backup → Restore
2. Select backup date
3. Choose data to restore
4. Confirm restoration
5. System restarts

---

## Multi-School Management (Super Admin)

### Managing Multiple Schools

**Super Admin Dashboard:**
- View all schools
- Switch between schools
- Compare performance
- Consolidated reports

**Add New School:**
1. Super Admin → "Add School"
2. Fill school details
3. Create school admin account
4. Configure school settings
5. Activate school

**School Settings:**
- Individual customization
- Shared resources
- Cross-school reports
- Centralized billing

---

## Security & Compliance

### Data Protection

**GDPR Compliance:**
- User data export
- Right to be forgotten
- Data processing agreement
- Consent management

**Security Measures:**
- SSL/TLS encryption
- Data encryption at rest
- Regular security audits
- Penetration testing
- Vulnerability scanning

### Audit Trail

**All actions logged:**
- Who did what
- When it happened
- What changed
- IP address
- Device information

**Access audit logs:**
Settings → Security → Audit Logs

---

## Support & Resources

### Get Help

**Support Channels:**
1. **In-App Support**
   - Settings → Help & Support
   - Live chat (9 AM - 6 PM)
   - Ticket system

2. **Email Support**
   - admin@smartcampus.com
   - Response within 24 hours

3. **Phone Support**
   - +1-XXX-XXX-XXXX
   - Priority support for admins

4. **Video Tutorials**
   - Settings → Video Guides
   - YouTube channel

### Training Resources

**Admin training:**
- Video tutorials
- PDF guides
- Webinars (monthly)
- One-on-one training sessions

### System Status

**Check system health:**
- status.smartcampus.com
- Server uptime
- Scheduled maintenance
- Known issues

---

## Contact & Feedback

**We're here to help:**

- 📧 Support: support@smartcampus.com
- 📱 Phone: +1-XXX-XXX-XXXX
- 💬 Live Chat: In-app (9 AM - 6 PM)
- 🌐 Website: www.smartcampus.com
- 📚 Documentation: docs.smartcampus.com

**Send feedback:**
Settings → "Send Feedback" → Rate features and suggest improvements

---

## Version Information

- **Platform**: iOS, Android, Web
- **Current Version**: 1.0.0
- **Last Updated**: December 2024
- **Support**: admin@smartcampus.com

---

*Empowering schools with smart technology* 🏫💻📱

