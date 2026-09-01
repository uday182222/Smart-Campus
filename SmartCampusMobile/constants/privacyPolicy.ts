export const PRIVACY_POLICY_UPDATED = '1 September 2026';

export const PRIVACY_POLICY_EMAIL = 'Cominddigital@gmail.com';

export const PRIVACY_POLICY_SECTIONS: { heading: string; body: string[] }[] = [
  {
    heading: 'Introduction',
    body: [
      'Smart Campus ("the App") is operated by Comind digital Private Limited ("we", "us", "our"). This policy explains what information the App collects, why we collect it, and the choices available to you.',
      'By using Smart Campus, you agree to the practices described below.',
    ],
  },
  {
    heading: '1. Who uses this App',
    body: [
      'Smart Campus is a school management platform used by:',
      '• Parents and guardians of enrolled students',
      '• Teachers and school staff',
      '• School administrators and principals',
      '• Transport staff (bus helpers)',
      '• Students, where the school provides them with an account',
      'Accounts are created and managed by the school. The App is not available for public sign-up.',
    ],
  },
  {
    heading: '2. Information we collect',
    body: [
      'Information provided by the school',
      'Schools enter student and staff records into the platform. This may include:',
      '• Name, class, section, and roll number',
      '• Date of birth and gender',
      '• Parent or guardian name, email address, and phone number',
      '• Attendance records',
      '• Homework assignments and submissions',
      '• Examination marks and academic reports',
      '• Fee records and payment status',
      '• Transport route and bus stop assignment',
      '• Teacher remarks about a student\'s progress or conduct',
      'Information you provide directly',
      '• Email address and password used to sign in',
      '• Messages sent to teachers, parents, or school staff',
      '• Appointment requests, including the reason for the appointment',
      '• Support queries submitted through the Help screen',
      '• Profile photographs, where you choose to upload one',
      'Information collected automatically',
      '• Device push notification token, used only to deliver school notifications',
      '• Basic technical logs (request time, error details) used to keep the service running',
      'We do not collect precise location data, contacts, browsing history, or advertising identifiers.',
    ],
  },
  {
    heading: '3. Camera and photo access',
    body: [
      'The App requests camera and photo library permission solely so that you can:',
      '• Upload a profile photograph',
      '• Upload a school logo (administrators only)',
      '• Attach a photograph to a homework submission, where the school enables this',
      'Photographs are uploaded only when you actively choose to do so. The App does not access your camera or photo library in the background.',
    ],
  },
  {
    heading: '4. Children\'s data',
    body: [
      'Smart Campus processes personal data relating to children, because school records inherently concern students.',
      'How we handle this:',
      '• Student records are entered and controlled by the school, acting as the data fiduciary for its pupils.',
      '• A student\'s data is visible only to that student\'s linked parent or guardian, their assigned teachers, and authorised school administrators.',
      '• Student accounts, where issued, are created by the school — not by the child independently.',
      '• We do not serve advertising of any kind in the App.',
      '• We do not use children\'s data for behavioural profiling, tracking, or marketing.',
      '• We do not sell or share children\'s data with third parties for their own purposes.',
      'In accordance with the Digital Personal Data Protection Act, 2023 (India), processing of a child\'s personal data is undertaken on the basis of consent obtained from the parent or guardian through the enrolling school. Parents may withdraw consent by contacting their school or by writing to us at the address in Section 11.',
    ],
  },
  {
    heading: '5. How we use information',
    body: [
      'We use the information described above only to:',
      '• Authenticate users and control what each role can see',
      '• Display attendance, homework, marks, fees, and transport information to authorised users',
      '• Send notifications about attendance, announcements, and school events',
      '• Enable messaging between parents, teachers, and school staff',
      '• Process appointment requests',
      '• Maintain, secure, and troubleshoot the service',
      'We do not use your information for advertising, profiling, or any purpose unrelated to running the school platform.',
    ],
  },
  {
    heading: '6. Sharing of information',
    body: [
      'We share information only in these circumstances:',
      '• Within your school. Data is visible to users of your own school according to their role. Schools using the platform cannot see each other\'s data.',
      '• Service providers. We use cloud hosting and push notification services that process data on our behalf under contractual confidentiality obligations.',
      '• Legal obligation. Where required by applicable law, court order, or a lawful request from a public authority.',
      'We do not sell personal data. We do not share personal data with advertisers or data brokers.',
    ],
  },
  {
    heading: '7. Data security',
    body: [
      'We apply reasonable technical and organisational measures to protect your information, including:',
      '• Encrypted password storage (passwords are hashed and are never stored or visible in readable form)',
      '• Role-based access controls, so users see only the data their role permits',
      '• Restricted administrative access to production systems',
      'No system is completely secure. If we become aware of a breach affecting your personal data, we will notify affected users and the relevant authority as required by law.',
    ],
  },
  {
    heading: '8. Data retention',
    body: [
      'We retain data for as long as the school maintains an active account with us, and for such period afterwards as is necessary to meet legal or record-keeping obligations.',
      'When a school ends its use of the platform, its data is deleted or returned according to the arrangement with that school.',
    ],
  },
  {
    heading: '9. Your rights',
    body: [
      'Subject to applicable law, you may:',
      '• Access the personal data we hold about you or your child',
      '• Correct inaccurate or incomplete information',
      '• Request deletion of personal data, where retention is not otherwise required',
      '• Withdraw consent for processing, understanding that this may prevent continued use of the App',
      '• Complain to the relevant data protection authority',
      'Because schools control their own records, requests are usually fastest when made to your school directly. You may also contact us using the details in Section 11, and we will assist.',
    ],
  },
  {
    heading: '10. Changes to this policy',
    body: [
      'We may update this policy from time to time. Material changes will be notified in the App or by email. The "Last updated" date at the top of this page indicates when it was last revised.',
    ],
  },
  {
    heading: '11. Contact us',
    body: [
      'For any question about this policy or about your personal data:',
      'Comind digital Private Limited',
      PRIVACY_POLICY_EMAIL,
      'We aim to respond to all privacy enquiries within 30 days.',
    ],
  },
];
