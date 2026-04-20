export interface TransportRoute {
  id: string;
  routeName: string;
  routeNumber: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  vehicleId: string;
  vehicleNumber: string;
  vehicleType: VehicleType;
  capacity: number;
  stops: RouteStop[];
  schedule: RouteSchedule;
  status: RouteStatus;
  schoolId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RouteStop {
  id: string;
  name: string;
  address: string;
  coordinates: {
    latitude: number;
    longitude: number;
  };
  estimatedArrivalTime: string;
  actualArrivalTime?: string;
  status: StopStatus;
  students: RouteStudent[];
}

export interface RouteStudent {
  id: string;
  name: string;
  classId: string;
  className: string;
  stopId: string;
  stopName: string;
  boardingTime: string;
  alightingTime: string;
  parentContact: string;
  status: StudentStatus;
}

export interface RouteSchedule {
  morning: {
    startTime: string;
    endTime: string;
    departureTimes: string[];
  };
  evening: {
    startTime: string;
    endTime: string;
    departureTimes: string[];
  };
  workingDays: number[]; // 1-7 (Monday-Sunday)
}

export type VehicleType = 'bus' | 'van' | 'car' | 'minibus';
export type RouteStatus = 'active' | 'inactive' | 'maintenance' | 'suspended';
export type StopStatus = 'pending' | 'arrived' | 'departed' | 'skipped';
export type StudentStatus = 'waiting' | 'boarded' | 'dropped' | 'absent';

export interface TransportStats {
  totalRoutes: number;
  activeRoutes: number;
  totalStudents: number;
  totalVehicles: number;
  onTimePercentage: number;
  averageDelay: number; // in minutes
}

export interface TransportFilters {
  routeId?: string;
  driverId?: string;
  vehicleType?: VehicleType;
  status?: RouteStatus;
  date?: Date;
}
