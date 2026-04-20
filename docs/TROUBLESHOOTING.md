# Smart Campus - Troubleshooting Guide

## Quick Issue Resolver

### 🚨 Emergency Issues

| Issue | Quick Fix |
|-------|-----------|
| **Can't login** | Reset password / Check internet / Update app |
| **App crashes** | Clear cache / Restart app / Reinstall |
| **Data not loading** | Pull to refresh / Check internet / Logout & login |
| **Notifications not working** | Check permissions / Enable in settings |
| **Payment failed** | Try different method / Check card details / Contact bank |

---

## Common Issues & Solutions

### 1. Login & Authentication Issues

#### ❌ "Invalid Credentials" Error

**Problem**: Can't login with email and password

**Solutions:**
1. ✅ **Verify email**: Use school-provided email (check for typos)
2. ✅ **Check password**: Password is case-sensitive
3. ✅ **Reset password**:
   - Tap "Forgot Password"
   - Enter email
   - Check email for reset link
   - Create new password
4. ✅ **Contact admin** if still not working

#### ❌ "Account Locked" Message

**Problem**: Account locked after multiple failed login attempts

**Solution:**
- Wait 15 minutes and try again
- Or contact school admin to unlock immediately

#### ❌ "Network Error" on Login

**Problem**: Can't reach login server

**Solutions:**
1. Check internet connection
2. Try switching WiFi ↔ Mobile data
3. Check if other apps work
4. Wait and retry in 2 minutes
5. Check status.smartcampus.com for server issues

---

### 2. Data Loading Issues

#### ❌ Dashboard Shows "Loading..." Forever

**Problem**: Data not loading on dashboard

**Solutions:**
1. **Pull down to refresh**
2. **Check internet**: Open browser, visit google.com
3. **Force close app**:
   - iOS: Swipe up from bottom → Swipe app up
   - Android: Recent apps → Swipe app away
4. **Logout and login again**
5. **Clear app cache**:
   - iOS: Settings → General → iPhone Storage → Smart Campus → Offload App
   - Android: Settings → Apps → Smart Campus → Clear Cache

#### ❌ "Failed to Load" Error with Retry Button

**Problem**: API request failed

**Solutions:**
1. Tap "Try Again" button
2. Check internet connection
3. Close and reopen app
4. Contact support if error persists

#### ❌ Data Appears Outdated

**Problem**: Seeing old data

**Solutions:**
1. **Pull down to refresh** on the screen
2. **Force refresh**: Settings → "Sync Data"
3. **Clear cache**: Settings → Storage → "Clear Cache"
4. **Logout & login** to force full data refresh

---

### 3. Attendance Issues

#### ❌ Can't Mark Attendance

**Problem**: Submit button disabled or greyed out

**Possible causes:**
- Attendance already marked for this date
- No students in class
- Not assigned to this class

**Solutions:**
1. Check if attendance already marked (look for checkmark icon)
2. Verify you selected the correct date
3. Confirm you're assigned to this class
4. Contact admin if class assignment is incorrect

#### ❌ Attendance Submitted But Not Showing

**Problem**: Marked attendance but parents didn't receive notification

**Solutions:**
1. Wait 2-3 minutes for sync
2. Go to Attendance History and verify it's saved
3. Check if API call succeeded (look for success message)
4. If not saved, mark again

#### ❌ "Already Marked" Error

**Problem**: Trying to mark attendance twice

**Solutions:**
- View attendance history for that date
- Edit existing attendance instead
- Contact admin if you need to re-mark

---

### 4. Homework Issues

#### ❌ Can't Create Homework

**Problem**: Create button disabled or error on submission

**Possible causes:**
- Missing required fields
- Due date in the past
- File too large
- Not assigned to class

**Solutions:**
1. Fill all required fields (Title, Subject, Due Date)
2. Set due date in the future
3. Reduce file size (< 10MB)
4. Verify class assignment

#### ❌ Attachment Upload Failed

**Problem**: Can't upload files to homework

**Solutions:**
1. **Check file size**: Max 10MB per file
2. **Check file type**: Allowed: PDF, DOC, DOCX, JPG, PNG, MP4
3. **Check internet**: Upload requires stable connection
4. **Retry upload**: Close and try again
5. **Compress file**: Use compression tool to reduce size

#### ❌ Students Not Seeing Homework

**Problem**: Created homework but students can't see it

**Solutions:**
1. Check homework status is "Published" (not Draft)
2. Verify correct class selected
3. Wait 2-3 minutes for sync
4. Ask student to refresh their app

---

### 5. Marks & Grades Issues

#### ❌ Can't Enter Marks

**Problem**: Submit button greyed out

**Possible causes:**
- Marks exceed total marks
- Exam not created
- Not assigned to this subject

**Solutions:**
1. Verify marks ≤ total marks
2. Create exam first before entering marks
3. Check subject assignment
4. Contact admin if still blocked

#### ❌ Marks Calculation Wrong

**Problem**: Percentage or grade incorrect

**Solutions:**
1. Verify marks entered correctly
2. Check total marks for exam
3. Formula: Percentage = (Marks Obtained / Total Marks) × 100
4. If still wrong, contact support

#### ❌ Parents Can't See Marks

**Problem**: Entered marks but parents not notified

**Solutions:**
1. Check if marks are "Published" (not Draft)
2. Wait 5 minutes for notification delivery
3. Ask parent to refresh dashboard
4. Verify parent account linked to student

---

### 6. Transport & Bus Tracking Issues

#### ❌ Bus Location Not Updating

**Problem**: Map shows old location or "No Data"

**Possible causes:**
- Bus helper hasn't started tracking
- GPS signal lost
- Helper app offline

**Solutions:**
1. Wait 2-3 minutes
2. Refresh the map
3. Contact bus helper
4. Report to transport coordinator

#### ❌ Wrong ETA Shown

**Problem**: Estimated time of arrival incorrect

**Causes:**
- Traffic conditions changed
- Route deviation
- GPS inaccuracy

**Note:** ETA is an estimate based on current location and speed. Actual arrival may vary ±5-10 minutes.

#### ❌ Can't See Child's Bus Route

**Problem**: Transport screen shows "No Route Assigned"

**Solutions:**
1. Verify child is assigned to a route (contact admin)
2. Check if transport service activated for your child
3. Refresh the app
4. Contact school office

---

### 7. Notification Issues

#### ❌ Not Receiving Notifications

**Problem**: No push notifications on phone

**Solutions:**
1. **Check app permissions**:
   - iOS: Settings → Smart Campus → Notifications → Allow
   - Android: Settings → Apps → Smart Campus → Notifications → Enable

2. **Check notification settings in app**:
   - Settings → Notifications
   - Enable notification types
   - Turn off "Quiet Hours" if active

3. **Check device settings**:
   - Do Not Disturb mode off
   - Notification sound enabled

4. **Re-register device**:
   - Settings → Notifications → "Re-register Device"

#### ❌ Too Many Notifications

**Problem**: Notification spam

**Solutions:**
1. Settings → Notifications
2. Disable unwanted categories
3. Enable "Quiet Hours" (e.g., 10 PM - 7 AM)
4. Set "Digest Mode" (bundle notifications)

---

### 8. Performance Issues

#### ❌ App is Slow/Laggy

**Problem**: App takes long to respond

**Solutions:**
1. **Close background apps**
2. **Clear app cache**:
   - Settings → Storage → Clear Cache
3. **Update app** to latest version
4. **Restart phone**
5. **Free up phone storage** (need at least 500MB free)

#### ❌ App Crashes Frequently

**Problem**: App closes unexpectedly

**Solutions:**
1. **Update app** to latest version
2. **Restart phone**
3. **Reinstall app**:
   - Uninstall
   - Restart phone
   - Reinstall from store
   - Login again

4. **Report crash**:
   - Settings → "Report Issue"
   - Describe when crash happens
   - Include screenshots

#### ❌ Images Not Loading

**Problem**: Profile pictures, gallery images not showing

**Solutions:**
1. Check internet connection
2. Wait for images to load (slow connection)
3. Tap reload icon
4. Clear image cache: Settings → Storage → "Clear Image Cache"

---

### 9. Payment Issues

#### ❌ Payment Failed

**Problem**: Fee payment transaction failed

**Possible causes:**
- Insufficient balance
- Card declined
- Bank server down
- 3D Secure authentication failed

**Solutions:**
1. **Check bank balance**
2. **Try different card/payment method**
3. **Enable online transactions** (call bank)
4. **Check daily transaction limit**
5. **Use alternative payment method**:
   - Net banking
   - UPI
   - Debit card
   - School office payment

#### ❌ Payment Deducted But Not Reflected

**Problem**: Money deducted but receipt not generated

**Solutions:**
1. **Wait 10-15 minutes** for processing
2. **Refresh payment page**
3. **Check transaction history**: Fees → "Transaction History"
4. **Contact support** with transaction ID if not reflected in 24 hours

---

### 10. Gallery & Media Issues

#### ❌ Can't Upload Photos

**Problem**: Upload fails or stuck

**Solutions:**
1. **Check file size**: Max 20MB per file
2. **Check file type**: JPEG, PNG, MP4 allowed
3. **Check internet**: Upload requires stable connection
4. **Compress image** before upload
5. **Retry after some time**

#### ❌ Photos Not Visible

**Problem**: Uploaded photos not showing in gallery

**Solutions:**
1. Check photo visibility setting (Public/Class/Private)
2. Wait 2-3 minutes for processing
3. Refresh gallery
4. Contact admin if photo is inappropriate (will be removed)

---

### 11. Calendar & Events Issues

#### ❌ Event Not Showing in Calendar

**Problem**: School event not visible

**Possible causes:**
- Event is for different audience (e.g., teachers only)
- Event is for different class
- Event is cancelled

**Solutions:**
1. Check event filters
2. Select "Show All Events"
3. Verify you're in target audience
4. Contact admin if event should be visible

---

## Error Messages Explained

### Common Error Messages

| Error Message | Meaning | Solution |
|---------------|---------|----------|
| **401 Unauthorized** | Session expired | Logout and login again |
| **403 Forbidden** | No permission | Contact admin for access |
| **404 Not Found** | Data doesn't exist | Check if item was deleted |
| **500 Server Error** | Backend issue | Wait and retry, report if persists |
| **Network Error** | No internet | Check connection |
| **Timeout** | Request too slow | Retry with better connection |

---

## Advanced Troubleshooting

### Debug Mode

**Enable debug mode for detailed logs:**
1. Settings → Advanced
2. Tap "Version" 7 times
3. Debug mode enabled
4. View detailed logs: Settings → "View Logs"

### Reset App Data

**⚠️ Warning: This deletes all local data**

1. Settings → Advanced → "Reset App Data"
2. Confirm action
3. App restarts
4. Login again
5. Data re-syncs from server

### Report a Bug

**Help us fix issues:**
1. Settings → "Report Issue"
2. Describe problem:
   - What you were doing
   - What happened
   - Expected behavior
3. Attach screenshot (tap camera icon)
4. Include device info (auto-populated)
5. Submit report

**We'll respond within:**
- Critical issues: 2-4 hours
- Major issues: 24 hours
- Minor issues: 2-3 business days

---

## Contact Support

### Support Tiers

**Tier 1: In-App Help**
- Help articles
- FAQs
- Video tutorials
- Chatbot assistance

**Tier 2: Email Support**
- support@smartcampus.com
- Response: 24 hours
- For non-urgent issues

**Tier 3: Phone Support**
- +1-XXX-XXX-XXXX
- Hours: 9 AM - 6 PM (Mon-Fri)
- For urgent issues

**Tier 4: Emergency Support**
- Critical system failures
- Security issues
- Data loss
- Available 24/7 for admins

### Before Contacting Support

**Have ready:**
- Your email ID
- School name
- Device type (iPhone 15 / Samsung Galaxy)
- App version (Settings → About)
- Screenshot of error (if any)
- Steps to reproduce issue

---

## Known Issues & Workarounds

### Issue: Slow Performance on Old Devices

**Devices affected:**
- iPhone 8 and older
- Android devices with < 2GB RAM

**Workaround:**
- Reduce data refresh rate
- Disable animations: Settings → Accessibility → "Reduce Motion"
- Clear cache regularly

### Issue: Calendar Sync Delays

**Current behavior:**
- Calendar events may take 2-3 minutes to appear

**Workaround:**
- Manually refresh calendar
- Check "Upcoming Events" section instead

### Issue: Bulk Operations Timeout

**Affected:**
- Bulk attendance marking (> 100 students)
- Bulk marks entry (> 50 students)

**Workaround:**
- Break into smaller batches
- Use web version for large batches
- Increase timeout: Settings → Advanced → "Request Timeout"

---

## Platform-Specific Issues

### iOS Issues

#### App Not Installing from App Store

**Solutions:**
1. Check iOS version (requires iOS 13+)
2. Free up storage space (need 200MB)
3. Sign out and in to App Store
4. Restart device

#### Notifications Not Showing on Lock Screen

**Solutions:**
1. Settings → Notifications → Smart Campus
2. Enable "Show on Lock Screen"
3. Enable "Show in Notification Center"
4. Set alert style to "Banners" or "Alerts"

### Android Issues

#### "App Not Installed" Error

**Solutions:**
1. Enable "Install from Unknown Sources"
2. Check storage space
3. Clear Google Play Store cache
4. Update Google Play Services

#### Notifications Not Working

**Solutions:**
1. Settings → Apps → Smart Campus → Notifications → Enable all
2. Disable battery optimization:
   - Settings → Battery → Battery Optimization
   - Find Smart Campus → Don't optimize
3. Enable Auto-start:
   - Settings → Apps → Smart Campus → Auto-start → Enable

---

## Data & Sync Issues

### Data Not Syncing

**Problem**: Changes not reflected across devices

**Solutions:**
1. **Force sync**: Settings → "Sync Now"
2. **Check sync status**: Settings → "Last Synced"
3. **Logout & login** to force full sync
4. **Check server status**: status.smartcampus.com

### Data Mismatch Between App and Web

**Problem**: Different data on mobile vs web

**Solutions:**
1. Refresh both platforms
2. Wait 2-3 minutes for sync
3. Check timestamp of last update
4. Report to support if mismatch persists > 10 minutes

---

## Network & Connectivity

### Offline Mode

**What works offline:**
- ✅ View cached data (dashboard, attendance history)
- ✅ Queue actions (attendance, homework creation)
- ✅ View downloaded reports
- ✅ Read messages

**What needs internet:**
- ❌ Live bus tracking
- ❌ Fetching new data
- ❌ Sending messages
- ❌ Making payments

**When back online:**
- Queued actions sync automatically
- Notification shows "Syncing X items"
- Wait for sync to complete

### Slow Internet Connection

**Optimize for slow connections:**
1. Settings → Data Usage → "Low Data Mode"
2. Disable image auto-load
3. Reduce refresh frequency
4. Use Wi-Fi when available

---

## App Update Issues

### Update Not Available

**Problem**: Can't find app update

**Solutions:**
1. **Check store**:
   - iOS: App Store → Updates → Pull to refresh
   - Android: Play Store → My Apps → Check for updates

2. **Manual check**:
   - App settings show current version
   - Compare with latest on store

3. **Force update**:
   - Uninstall app
   - Reinstall from store

### Update Failed

**Solutions:**
1. Free up storage space
2. Check internet connection
3. Restart device
4. Try updating later

---

## Security & Privacy

### Account Compromised

**If you suspect unauthorized access:**

**Immediate actions:**
1. 🚨 **Change password immediately**
2. 🚨 **Logout from all devices**: Settings → Security → "Logout All Sessions"
3. 🚨 **Enable 2FA**: Settings → Security → "Two-Factor Authentication"
4. 🚨 **Contact support**: Report the incident

**Check for:**
- Unknown login locations
- Unexpected data changes
- Settings modifications

### Reset Security

**Start fresh:**
1. Change password
2. Remove all trusted devices
3. Enable 2FA
4. Review login history
5. Check recent activities

---

## Installation & Setup

### App Won't Install

**Storage issues:**
- Need at least 200MB free space
- Clear unnecessary files
- Move photos to cloud
- Delete unused apps

**Compatibility:**
- iOS 13 or later
- Android 8.0 (Oreo) or later

### First Time Setup Stuck

**Problem**: Setup wizard not progressing

**Solutions:**
1. Check internet connection
2. Allow all permissions when prompted
3. Restart app
4. Skip optional steps and configure later

---

## Payment & Fees

### Online Payment Not Working

**Problem**: Can't complete fee payment

**Common causes:**
- Card declined
- OTP not received
- Payment gateway down
- Insufficient funds

**Solutions:**
1. **Check card details** (number, expiry, CVV)
2. **Enable online transactions** (call bank)
3. **Check OTP** (SMS may be delayed)
4. **Try different payment method**
5. **Pay at school office** as alternative

### Receipt Not Generated

**Problem**: Paid but no receipt

**Solutions:**
1. Wait 10 minutes for processing
2. Check email for receipt
3. Go to Fees → "Payment History"
4. Download receipt from history
5. Contact support with transaction ID

---

## Technical Support

### Collect Debug Information

**When reporting issues, include:**

1. **Device Info**:
   - Settings → About → Copy device info

2. **App Version**:
   - Settings → About → Version

3. **Error Screenshot**:
   - Take screenshot when error appears

4. **Steps to Reproduce**:
   - What you did before error
   - What happened
   - What you expected

### Submit Support Ticket

1. Settings → "Help & Support"
2. Tap "Submit Ticket"
3. Select issue category
4. Describe problem
5. Attach screenshots
6. Submit
7. Note ticket number
8. Track status in "My Tickets"

---

## Escalation Matrix

| Issue Severity | Response Time | Contact |
|----------------|---------------|---------|
| **Critical** (Can't access app) | 2-4 hours | Phone support |
| **High** (Major feature broken) | 24 hours | Email support |
| **Medium** (Feature not working) | 2-3 days | In-app ticket |
| **Low** (Minor issue/question) | 1 week | FAQ/Help articles |

---

## Useful Links

- 🌐 **Web Portal**: web.smartcampus.com
- 📚 **Help Center**: help.smartcampus.com
- 📹 **Video Tutorials**: youtube.com/smartcampus
- 📊 **System Status**: status.smartcampus.com
- 💬 **Community Forum**: community.smartcampus.com

---

## Still Need Help?

**Contact Us:**
- 📧 Email: support@smartcampus.com
- 📱 Phone: +1-XXX-XXX-XXXX
- 💬 Live Chat: In-app (9 AM - 6 PM)
- 🎫 Support Ticket: In-app help section

**Emergency:**
For critical issues affecting multiple users, call emergency hotline:
- 🚨 +1-XXX-XXX-XXXX (24/7)

---

*Last Updated: December 2024 • Version 1.0.0*

