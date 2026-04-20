class ApiConstants {
  // Base URLs
  static const String baseUrl = 'https://api.smartcampus.com';
  static const String devBaseUrl = 'https://dev-api.smartcampus.com';
  static const String stagingBaseUrl = 'https://staging-api.smartcampus.com';
  
  // API Version
  static const String apiVersion = 'v1';
  static const String apiPrefix = '/api/$apiVersion';
  
  // Authentication Endpoints
  static const String loginEndpoint = '/auth/login';
  static const String logoutEndpoint = '/auth/logout';
  static const String refreshTokenEndpoint = '/auth/refresh';
  static const String forgotPasswordEndpoint = '/auth/forgot-password';
  static const String resetPasswordEndpoint = '/auth/reset-password';
  static const String changePasswordEndpoint = '/auth/change-password';
  static const String verifyEmailEndpoint = '/auth/verify-email';
  
  // User Management Endpoints
  static const String usersEndpoint = '/users';
  static const String profileEndpoint = '/users/profile';
  static const String updateProfileEndpoint = '/users/profile/update';
  static const String uploadAvatarEndpoint = '/users/profile/avatar';
  
  // School Management Endpoints
  static const String schoolsEndpoint = '/schools';
  static const String schoolDetailsEndpoint = '/schools/{schoolId}';
  static const String createSchoolEndpoint = '/schools/create';
  static const String updateSchoolEndpoint = '/schools/{schoolId}/update';
  static const String deleteSchoolEndpoint = '/schools/{schoolId}/delete';
  static const String schoolAnalyticsEndpoint = '/schools/{schoolId}/analytics';
  
  // Student Management Endpoints
  static const String studentsEndpoint = '/students';
  static const String studentDetailsEndpoint = '/students/{studentId}';
  static const String createStudentEndpoint = '/students/create';
  static const String updateStudentEndpoint = '/students/{studentId}/update';
  static const String deleteStudentEndpoint = '/students/{studentId}/delete';
  static const String studentListEndpoint = '/students/list';
  static const String studentSearchEndpoint = '/students/search';
  
  // Class Management Endpoints
  static const String classesEndpoint = '/classes';
  static const String classDetailsEndpoint = '/classes/{classId}';
  static const String createClassEndpoint = '/classes/create';
  static const String updateClassEndpoint = '/classes/{classId}/update';
  static const String deleteClassEndpoint = '/classes/{classId}/delete';
  static const String classStudentsEndpoint = '/classes/{classId}/students';
  
  // Subject Management Endpoints
  static const String subjectsEndpoint = '/subjects';
  static const String subjectDetailsEndpoint = '/subjects/{subjectId}';
  static const String createSubjectEndpoint = '/subjects/create';
  static const String updateSubjectEndpoint = '/subjects/{subjectId}/update';
  static const String deleteSubjectEndpoint = '/subjects/{subjectId}/delete';
  
  // Teacher Management Endpoints
  static const String teachersEndpoint = '/teachers';
  static const String teacherDetailsEndpoint = '/teachers/{teacherId}';
  static const String createTeacherEndpoint = '/teachers/create';
  static const String updateTeacherEndpoint = '/teachers/{teacherId}/update';
  static const String deleteTeacherEndpoint = '/teachers/{teacherId}/delete';
  static const String teacherClassesEndpoint = '/teachers/{teacherId}/classes';
  
  // Attendance Endpoints
  static const String attendanceEndpoint = '/attendance';
  static const String markAttendanceEndpoint = '/attendance/mark';
  static const String attendanceHistoryEndpoint = '/attendance/history';
  static const String classAttendanceEndpoint = '/attendance/class/{classId}';
  static const String studentAttendanceEndpoint = '/attendance/student/{studentId}';
  static const String attendanceReportEndpoint = '/attendance/report';
  
  // Homework Endpoints
  static const String homeworkEndpoint = '/homework';
  static const String homeworkDetailsEndpoint = '/homework/{homeworkId}';
  static const String createHomeworkEndpoint = '/homework/create';
  static const String updateHomeworkEndpoint = '/homework/{homeworkId}/update';
  static const String deleteHomeworkEndpoint = '/homework/{homeworkId}/delete';
  static const String classHomeworkEndpoint = '/homework/class/{classId}';
  static const String studentHomeworkEndpoint = '/homework/student/{studentId}';
  static const String submitHomeworkEndpoint = '/homework/{homeworkId}/submit';
  
  // Announcements Endpoints
  static const String announcementsEndpoint = '/announcements';
  static const String announcementDetailsEndpoint = '/announcements/{announcementId}';
  static const String createAnnouncementEndpoint = '/announcements/create';
  static const String updateAnnouncementEndpoint = '/announcements/{announcementId}/update';
  static const String deleteAnnouncementEndpoint = '/announcements/{announcementId}/delete';
  static const String schoolAnnouncementsEndpoint = '/announcements/school/{schoolId}';
  static const String classAnnouncementsEndpoint = '/announcements/class/{classId}';
  
  // Events Endpoints
  static const String eventsEndpoint = '/events';
  static const String eventDetailsEndpoint = '/events/{eventId}';
  static const String createEventEndpoint = '/events/create';
  static const String updateEventEndpoint = '/events/{eventId}/update';
  static const String deleteEventEndpoint = '/events/{eventId}/delete';
  static const String schoolEventsEndpoint = '/events/school/{schoolId}';
  static const String eventCalendarEndpoint = '/events/calendar';
  
  // Timetable Endpoints
  static const String timetableEndpoint = '/timetable';
  static const String timetableDetailsEndpoint = '/timetable/{timetableId}';
  static const String createTimetableEndpoint = '/timetable/create';
  static const String updateTimetableEndpoint = '/timetable/{timetableId}/update';
  static const String deleteTimetableEndpoint = '/timetable/{timetableId}/delete';
  static const String classTimetableEndpoint = '/timetable/class/{classId}';
  static const String teacherTimetableEndpoint = '/timetable/teacher/{teacherId}';
  static const String uploadTimetableEndpoint = '/timetable/upload';
  
  // Transport Endpoints
  static const String transportEndpoint = '/transport';
  static const String transportDetailsEndpoint = '/transport/{transportId}';
  static const String createTransportEndpoint = '/transport/create';
  static const String updateTransportEndpoint = '/transport/{transportId}/update';
  static const String deleteTransportEndpoint = '/transport/{transportId}/delete';
  static const String transportRoutesEndpoint = '/transport/routes';
  static const String transportTrackingEndpoint = '/transport/tracking';
  static const String transportUpdateEndpoint = '/transport/update';
  
  // Fees Endpoints
  static const String feesEndpoint = '/fees';
  static const String feeStructureEndpoint = '/fees/structure';
  static const String feeHistoryEndpoint = '/fees/history';
  static const String feeDuesEndpoint = '/fees/dues';
  static const String studentFeesEndpoint = '/fees/student/{studentId}';
  static const String feePaymentEndpoint = '/fees/payment';
  
  // Gallery Endpoints
  static const String galleryEndpoint = '/gallery';
  static const String uploadMediaEndpoint = '/gallery/upload';
  static const String mediaDetailsEndpoint = '/gallery/{mediaId}';
  static const String deleteMediaEndpoint = '/gallery/{mediaId}/delete';
  static const String schoolGalleryEndpoint = '/gallery/school/{schoolId}';
  static const String classGalleryEndpoint = '/gallery/class/{classId}';
  
  // Appointments Endpoints
  static const String appointmentsEndpoint = '/appointments';
  static const String appointmentDetailsEndpoint = '/appointments/{appointmentId}';
  static const String createAppointmentEndpoint = '/appointments/create';
  static const String updateAppointmentEndpoint = '/appointments/{appointmentId}/update';
  static const String deleteAppointmentEndpoint = '/appointments/{appointmentId}/delete';
  static const String appointmentRequestsEndpoint = '/appointments/requests';
  static const String appointmentHistoryEndpoint = '/appointments/history';
  
  // Reports Endpoints
  static const String reportsEndpoint = '/reports';
  static const String attendanceReportsEndpoint = '/reports/attendance';
  static const String academicReportEndpoint = '/reports/academic';
  static const String financialReportEndpoint = '/reports/financial';
  static const String analyticsReportEndpoint = '/reports/analytics';
  
  // File Upload Endpoints
  static const String uploadEndpoint = '/upload';
  static const String uploadImageEndpoint = '/upload/image';
  static const String uploadFileEndpoint = '/upload/file';
  static const String uploadDocumentEndpoint = '/upload/document';
  
  // Search Endpoints
  static const String searchEndpoint = '/search';
  static const String searchStudentsEndpoint = '/search/students';
  static const String searchTeachersEndpoint = '/search/teachers';
  static const String searchClassesEndpoint = '/search/classes';
  
  // Notification Endpoints
  static const String notificationsEndpoint = '/notifications';
  static const String notificationSettingsEndpoint = '/notifications/settings';
  static const String markNotificationReadEndpoint = '/notifications/{notificationId}/read';
  static const String deleteNotificationEndpoint = '/notifications/{notificationId}/delete';
  
  // HTTP Headers
  static const String contentTypeHeader = 'Content-Type';
  static const String authorizationHeader = 'Authorization';
  static const String acceptHeader = 'Accept';
  static const String userAgentHeader = 'User-Agent';
  static const String contentTypeJson = 'application/json';
  static const String contentTypeMultipart = 'multipart/form-data';
  static const String acceptJson = 'application/json';
  static const String bearerPrefix = 'Bearer ';
  
  // HTTP Status Codes
  static const int statusOk = 200;
  static const int statusCreated = 201;
  static const int statusNoContent = 204;
  static const int statusBadRequest = 400;
  static const int statusUnauthorized = 401;
  static const int statusForbidden = 403;
  static const int statusNotFound = 404;
  static const int statusConflict = 409;
  static const int statusUnprocessableEntity = 422;
  static const int statusInternalServerError = 500;
  static const int statusBadGateway = 502;
  static const int statusServiceUnavailable = 503;
  
  // API Response Keys
  static const String successKey = 'success';
  static const String messageKey = 'message';
  static const String dataKey = 'data';
  static const String errorKey = 'error';
  static const String errorsKey = 'errors';
  static const String tokenKey = 'token';
  static const String refreshTokenKey = 'refresh_token';
  static const String userKey = 'user';
  static const String paginationKey = 'pagination';
  static const String totalKey = 'total';
  static const String pageKey = 'page';
  static const String limitKey = 'limit';
  
  // Query Parameters
  static const String pageParam = 'page';
  static const String limitParam = 'limit';
  static const String searchParam = 'search';
  static const String sortParam = 'sort';
  static const String orderParam = 'order';
  static const String filterParam = 'filter';
  static const String dateParam = 'date';
  static const String startDateParam = 'start_date';
  static const String endDateParam = 'end_date';
  static const String classIdParam = 'class_id';
  static const String studentIdParam = 'student_id';
  static const String teacherIdParam = 'teacher_id';
  static const String schoolIdParam = 'school_id';
  
  // Default Values
  static const int defaultPage = 1;
  static const int defaultLimit = 20;
  static const String defaultSort = 'created_at';
  static const String defaultOrder = 'desc';
  
  // Timeout Values
  static const int connectionTimeoutSeconds = 30;
  static const int receiveTimeoutSeconds = 30;
  static const int sendTimeoutSeconds = 30;
  
  // Retry Configuration
  static const int maxRetries = 3;
  static const int retryDelayMilliseconds = 1000;
  
  // Cache Configuration
  static const int cacheMaxAgeHours = 1;
  static const int tokenRefreshThresholdMinutes = 5;
} 