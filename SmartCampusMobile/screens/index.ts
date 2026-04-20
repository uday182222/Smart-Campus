/**
 * Smart Campus - Screen Exports
 * Central export point for all screens
 */

// Teacher Screens
export { TeacherDashboard } from './teacher';

// Attendance Screen (shared)
export { default as AttendanceScreen } from './teacher/AttendanceScreen';

// Parent Screens
export { MarksScreen } from './parent';

// Transport Screens
export { ConductorPortal, ParentBusTracking } from './transport';

// Re-export Production screens for backward compatibility
export { default as ProductionLoginScreen } from './ProductionLoginScreen';
export { default as ProductionTeacherDashboard } from './ProductionTeacherDashboard';
export { default as ProductionParentDashboard } from './ProductionParentDashboard';
export { default as ProductionAdminDashboard } from './ProductionAdminDashboard';
export { default as ProductionStudentDashboard } from './ProductionStudentDashboard';
