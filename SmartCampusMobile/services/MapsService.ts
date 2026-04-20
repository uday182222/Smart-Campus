/**
 * Maps Service
 * Google Maps integration for route visualization and real-time tracking
 */

import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Google Maps API Key - should be set via environment variable
// For Expo: Use app.json config or expo-constants
// For production: Set via EAS Secrets or environment variables
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  (__DEV__ ? 'YOUR_DEV_GOOGLE_MAPS_API_KEY' : 'YOUR_PROD_GOOGLE_MAPS_API_KEY');

export interface MapCoordinate {
  latitude: number;
  longitude: number;
}

export interface MapMarker {
  id: string;
  coordinate: MapCoordinate;
  title: string;
  description: string;
  type: 'stop' | 'bus' | 'school' | 'student';
  icon?: string;
  color?: string;
  data?: any;
}

export interface RoutePolyline {
  coordinates: MapCoordinate[];
  color: string;
  width: number;
}

export interface DirectionsResult {
  distance: number; // in meters
  duration: number; // in seconds
  polyline: string; // encoded polyline
  steps: DirectionStep[];
}

export interface DirectionStep {
  instruction: string;
  distance: number;
  duration: number;
  startLocation: MapCoordinate;
  endLocation: MapCoordinate;
}

export interface ETACalculation {
  stopId: string;
  estimatedArrival: Date;
  distance: number;
  duration: number;
  trafficDelay: number;
  confidence: number;
}

export interface TrafficData {
  speedKmh: number;
  congestionLevel: 'low' | 'medium' | 'high';
  delay: number; // additional minutes
}

class MapsService {
  private apiKey: string;

  constructor() {
    this.apiKey = GOOGLE_MAPS_API_KEY;
  }

  // DIRECTIONS API

  /**
   * Get directions between two points
   */
  async getDirections(
    origin: MapCoordinate,
    destination: MapCoordinate,
    waypoints?: MapCoordinate[]
  ): Promise<DirectionsResult> {
    try {
      const waypointsParam = waypoints
        ? `&waypoints=${waypoints.map(w => `${w.latitude},${w.longitude}`).join('|')}`
        : '';

      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=${origin.latitude},${origin.longitude}&destination=${destination.latitude},${destination.longitude}${waypointsParam}&key=${this.apiKey}&departure_time=now&traffic_model=best_guess`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Directions API error: ${data.status}`);
      }

      const route = data.routes[0];
      const leg = route.legs[0];

      return {
        distance: leg.distance.value,
        duration: leg.duration.value,
        polyline: route.overview_polyline.points,
        steps: leg.steps.map((step: any) => ({
          instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
          distance: step.distance.value,
          duration: step.duration.value,
          startLocation: {
            latitude: step.start_location.lat,
            longitude: step.start_location.lng,
          },
          endLocation: {
            latitude: step.end_location.lat,
            longitude: step.end_location.lng,
          },
        })),
      };
    } catch (error) {
      console.error('Error getting directions:', error);
      throw error;
    }
  }

  /**
   * Get route with traffic data
   */
  async getRouteWithTraffic(
    stops: MapCoordinate[]
  ): Promise<{ directions: DirectionsResult; traffic: TrafficData }> {
    if (stops.length < 2) {
      throw new Error('At least 2 stops required for route');
    }

    const origin = stops[0];
    const destination = stops[stops.length - 1];
    const waypoints = stops.slice(1, -1);

    const directions = await this.getDirections(origin, destination, waypoints);

    // Calculate traffic impact
    const traffic = this.analyzeTraffic(directions.duration, directions.distance);

    return { directions, traffic };
  }

  /**
   * Analyze traffic conditions
   */
  private analyzeTraffic(duration: number, distance: number): TrafficData {
    // Calculate average speed
    const speedMps = distance / duration; // meters per second
    const speedKmh = (speedMps * 3600) / 1000; // km/h

    // Determine congestion level
    let congestionLevel: 'low' | 'medium' | 'high' = 'low';
    let delay = 0;

    if (speedKmh < 15) {
      congestionLevel = 'high';
      delay = Math.ceil(duration * 0.3 / 60); // 30% delay
    } else if (speedKmh < 25) {
      congestionLevel = 'medium';
      delay = Math.ceil(duration * 0.15 / 60); // 15% delay
    }

    return {
      speedKmh: Math.round(speedKmh),
      congestionLevel,
      delay,
    };
  }

  /**
   * Calculate ETA for all stops
   */
  async calculateETAsForRoute(
    currentLocation: MapCoordinate,
    remainingStops: Array<{ id: string; coordinate: MapCoordinate }>
  ): Promise<ETACalculation[]> {
    const etas: ETACalculation[] = [];
    let cumulativeTime = 0;
    let previousLocation = currentLocation;

    for (const stop of remainingStops) {
      try {
        const directions = await this.getDirections(previousLocation, stop.coordinate);
        const traffic = this.analyzeTraffic(directions.duration, directions.distance);

        // Calculate ETA
        const durationMinutes = Math.ceil(directions.duration / 60);
        const totalMinutes = durationMinutes + traffic.delay + 2; // 2 min buffer per stop
        cumulativeTime += totalMinutes;

        const estimatedArrival = new Date();
        estimatedArrival.setMinutes(estimatedArrival.getMinutes() + cumulativeTime);

        // Calculate confidence based on traffic
        const confidence = traffic.congestionLevel === 'high' ? 70 :
                          traffic.congestionLevel === 'medium' ? 85 : 95;

        etas.push({
          stopId: stop.id,
          estimatedArrival,
          distance: directions.distance,
          duration: totalMinutes,
          trafficDelay: traffic.delay,
          confidence,
        });

        previousLocation = stop.coordinate;
      } catch (error) {
        console.error(`Error calculating ETA for stop ${stop.id}:`, error);
        
        // Fallback ETA based on straight-line distance
        const straightLineDistance = this.calculateDistance(
          previousLocation.latitude,
          previousLocation.longitude,
          stop.coordinate.latitude,
          stop.coordinate.longitude
        );
        
        const fallbackDuration = Math.ceil(straightLineDistance / 400); // Assume 400m/min avg speed
        cumulativeTime += fallbackDuration;

        const estimatedArrival = new Date();
        estimatedArrival.setMinutes(estimatedArrival.getMinutes() + cumulativeTime);

        etas.push({
          stopId: stop.id,
          estimatedArrival,
          distance: straightLineDistance,
          duration: fallbackDuration,
          trafficDelay: 0,
          confidence: 50, // Low confidence for fallback
        });
      }
    }

    return etas;
  }

  // GEOCODING

  /**
   * Geocode address to coordinates
   */
  async geocodeAddress(address: string): Promise<MapCoordinate> {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Geocoding error: ${data.status}`);
      }

      const location = data.results[0].geometry.location;
      return {
        latitude: location.lat,
        longitude: location.lng,
      };
    } catch (error) {
      console.error('Error geocoding address:', error);
      throw error;
    }
  }

  /**
   * Reverse geocode coordinates to address
   */
  async reverseGeocode(coordinate: MapCoordinate): Promise<string> {
    try {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&key=${this.apiKey}`;
      
      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Reverse geocoding error: ${data.status}`);
      }

      return data.results[0].formatted_address;
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      throw error;
    }
  }

  // DISTANCE MATRIX

  /**
   * Get distance and duration between multiple origins and destinations
   */
  async getDistanceMatrix(
    origins: MapCoordinate[],
    destinations: MapCoordinate[]
  ): Promise<any> {
    try {
      const originsParam = origins.map(o => `${o.latitude},${o.longitude}`).join('|');
      const destinationsParam = destinations.map(d => `${d.latitude},${d.longitude}`).join('|');

      const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${originsParam}&destinations=${destinationsParam}&key=${this.apiKey}&departure_time=now`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error(`Distance Matrix API error: ${data.status}`);
      }

      return data;
    } catch (error) {
      console.error('Error getting distance matrix:', error);
      throw error;
    }
  }

  // POLYLINE UTILITIES

  /**
   * Decode Google polyline to coordinates
   */
  static decodePolyline(encoded: string): MapCoordinate[] {
    const points: MapCoordinate[] = [];
    let index = 0;
    let lat = 0;
    let lng = 0;

    while (index < encoded.length) {
      let b;
      let shift = 0;
      let result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += dlat;

      shift = 0;
      result = 0;

      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += dlng;

      points.push({
        latitude: lat / 1e5,
        longitude: lng / 1e5,
      });
    }

    return points;
  }

  /**
   * Simplify polyline for performance
   */
  static simplifyPolyline(
    coordinates: MapCoordinate[],
    tolerance: number = 0.0001
  ): MapCoordinate[] {
    if (coordinates.length <= 2) return coordinates;

    // Douglas-Peucker algorithm
    let maxDistance = 0;
    let maxIndex = 0;

    for (let i = 1; i < coordinates.length - 1; i++) {
      const distance = this.perpendicularDistance(
        coordinates[i],
        coordinates[0],
        coordinates[coordinates.length - 1]
      );

      if (distance > maxDistance) {
        maxDistance = distance;
        maxIndex = i;
      }
    }

    if (maxDistance > tolerance) {
      const left = this.simplifyPolyline(coordinates.slice(0, maxIndex + 1), tolerance);
      const right = this.simplifyPolyline(coordinates.slice(maxIndex), tolerance);
      return [...left.slice(0, -1), ...right];
    }

    return [coordinates[0], coordinates[coordinates.length - 1]];
  }

  /**
   * Calculate perpendicular distance
   */
  private static perpendicularDistance(
    point: MapCoordinate,
    lineStart: MapCoordinate,
    lineEnd: MapCoordinate
  ): number {
    const x = point.latitude;
    const y = point.longitude;
    const x1 = lineStart.latitude;
    const y1 = lineStart.longitude;
    const x2 = lineEnd.latitude;
    const y2 = lineEnd.longitude;

    const A = x - x1;
    const B = y - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;

    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = x - xx;
    const dy = y - yy;

    return Math.sqrt(dx * dx + dy * dy);
  }

  // UTILITY METHODS

  /**
   * Calculate distance between two points (Haversine formula)
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  }

  /**
   * Calculate bearing between two points
   */
  calculateBearing(from: MapCoordinate, to: MapCoordinate): number {
    const φ1 = (from.latitude * Math.PI) / 180;
    const φ2 = (to.latitude * Math.PI) / 180;
    const Δλ = ((to.longitude - from.longitude) * Math.PI) / 180;

    const y = Math.sin(Δλ) * Math.cos(φ2);
    const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(Δλ);
    const θ = Math.atan2(y, x);

    return ((θ * 180) / Math.PI + 360) % 360;
  }

  /**
   * Get map region for coordinates
   */
  static getRegionForCoordinates(coordinates: MapCoordinate[]): {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  } {
    if (coordinates.length === 0) {
      return {
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      };
    }

    let minLat = coordinates[0].latitude;
    let maxLat = coordinates[0].latitude;
    let minLng = coordinates[0].longitude;
    let maxLng = coordinates[0].longitude;

    coordinates.forEach(coord => {
      minLat = Math.min(minLat, coord.latitude);
      maxLat = Math.max(maxLat, coord.latitude);
      minLng = Math.min(minLng, coord.longitude);
      maxLng = Math.max(maxLng, coord.longitude);
    });

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;
    const deltaLat = (maxLat - minLat) * 1.2; // 20% padding
    const deltaLng = (maxLng - minLng) * 1.2;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: Math.max(deltaLat, 0.01),
      longitudeDelta: Math.max(deltaLng, 0.01),
    };
  }

  /**
   * Check if point is within radius
   */
  static isWithinRadius(
    point: MapCoordinate,
    center: MapCoordinate,
    radiusMeters: number
  ): boolean {
    const distance = new MapsService().calculateDistance(
      point.latitude,
      point.longitude,
      center.latitude,
      center.longitude
    );
    return distance <= radiusMeters;
  }

  /**
   * Format distance for display
   */
  static formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    }
    return `${(meters / 1000).toFixed(1)} km`;
  }

  /**
   * Format duration for display
   */
  static formatDuration(seconds: number): string {
    const minutes = Math.ceil(seconds / 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  }

  /**
   * Animate marker position
   */
  static animateMarkerToCoordinate(
    currentCoord: MapCoordinate,
    targetCoord: MapCoordinate,
    steps: number = 60
  ): MapCoordinate[] {
    const animations: MapCoordinate[] = [];
    
    for (let i = 0; i <= steps; i++) {
      const ratio = i / steps;
      animations.push({
        latitude: currentCoord.latitude + (targetCoord.latitude - currentCoord.latitude) * ratio,
        longitude: currentCoord.longitude + (targetCoord.longitude - currentCoord.longitude) * ratio,
      });
    }

    return animations;
  }

  /**
   * Get map snapshot URI
   */
  async getStaticMapUri(
    center: MapCoordinate,
    zoom: number = 15,
    width: number = 600,
    height: number = 400,
    markers?: MapMarker[]
  ): Promise<string> {
    let url = `https://maps.googleapis.com/maps/api/staticmap?center=${center.latitude},${center.longitude}&zoom=${zoom}&size=${width}x${height}&key=${this.apiKey}`;

    if (markers) {
      markers.forEach(marker => {
        url += `&markers=color:${marker.color || 'red'}|${marker.coordinate.latitude},${marker.coordinate.longitude}`;
      });
    }

    return url;
  }
}

export default new MapsService();



