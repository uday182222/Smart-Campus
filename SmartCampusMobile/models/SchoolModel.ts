/**
 * School Model
 * 
 * Enhanced model for multi-tenant school management with branding support.
 * Supports AWS S3 logo storage and DynamoDB persistence.
 */

export interface LogoInfo {
  url: string;                    // S3 URL: "https://s3...logo.png"
  thumbnailUrl?: string;          // Optimized thumbnail version
  fileName: string;               // "lotus-public-logo.png"
  fileSize: number;               // In bytes
  uploadedAt: Date;
  uploadedBy?: string;            // Admin user ID who uploaded
}

export interface BrandingInfo {
  primaryColor: string;           // "#3B82F6"
  secondaryColor: string;         // "#1E3A8A"
  accentColor: string;            // "#10B981"
  fontFamily?: string;            // Custom font name (optional)
}

export type SchoolStatus = 'active' | 'inactive' | 'pending' | 'suspended';

export type SubscriptionPlan = 'free' | 'basic' | 'premium' | 'enterprise';

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  validUntil: Date;
  features: string[];             // e.g., ['attendance', 'homework', 'communication']
}

export interface SchoolStats {
  totalStudents: number;
  totalTeachers: number;
  totalParents: number;
  totalStaff: number;
}

export interface School {
  // Core Information
  id: string;                     // Auto-generated UUID
  schoolId: string;               // Unique format: SCH-2025-A12
  name: string;                   // "Lotus Public School"
  
  // Branding - NEW FEATURE
  logo: LogoInfo;                 // School logo stored in S3
  branding?: BrandingInfo;        // Optional custom colors
  
  // Location
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  
  // Contact Information
  phone: string;
  email: string;
  website?: string;
  
  // Administrator Information
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  
  // Status & Subscription
  status: SchoolStatus;
  subscription: SubscriptionInfo;
  
  // Statistics (cached for performance)
  stats?: SchoolStats;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;              // Super admin user ID
}

/**
 * Create school input (for creation form)
 */
export interface CreateSchoolInput {
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  phone: string;
  email: string;
  website?: string;
  adminName: string;
  adminEmail: string;
  adminPhone: string;
  logoFile?: File | Blob;         // Logo file to upload
  logoFileName?: string;
  branding?: Partial<BrandingInfo>;
}

/**
 * Update school input
 */
export interface UpdateSchoolInput {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  status?: SchoolStatus;
  subscription?: Partial<SubscriptionInfo>;
  logoFile?: File | Blob;
  logoFileName?: string;
  branding?: Partial<BrandingInfo>;
}

/**
 * School list filter
 */
export interface SchoolFilter {
  status?: SchoolStatus;
  plan?: SubscriptionPlan;
  searchQuery?: string;
}

/**
 * Default branding values
 */
export const DEFAULT_BRANDING: BrandingInfo = {
  primaryColor: '#3B82F6',        // Indigo Blue
  secondaryColor: '#1E3A8A',      // Deep Navy
  accentColor: '#10B981',         // Emerald Green
};

/**
 * Validation helper
 */
export const SchoolValidation = {
  isValidSchoolId: (schoolId: string): boolean => {
    // Formats: SCH-2025-A12, SCH001, SCHOOL001
    const regex1 = /^SCH-\d{4}-[A-Z]\d{2}$/;
    const regex2 = /^SCH\d{3}$/;
    const regex3 = /^SCHOOL\d{3}$/;
    return regex1.test(schoolId) || regex2.test(schoolId) || regex3.test(schoolId);
  },
  
  isValidEmail: (email: string): boolean => {
    const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/;
    return regex.test(email);
  },
  
  isValidPhone: (phone: string): boolean => {
    const regex = /^[\d\s\-\+\(\)]+$/;
    return phone.length >= 10 && regex.test(phone);
  },
  
  isValidColor: (color: string): boolean => {
    const regex = /^#[0-9A-Fa-f]{6}$/;
    return regex.test(color);
  }
};

