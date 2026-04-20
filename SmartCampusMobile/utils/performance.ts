// @ts-nocheck
/**
 * Performance Optimization Utilities
 * Image optimization, caching, memoization, and performance monitoring
 */

import { Image } from 'react-native';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useMemo, useCallback, useRef, useEffect } from 'react';

// Cache Configuration
const CACHE_DIR = `${FileSystem.cacheDirectory}images/`;
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100MB
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CacheEntry {
  url: string;
  localUri: string;
  size: number;
  timestamp: number;
}

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

/**
 * Image Optimization Service
 */
export class ImageOptimizer {
  /**
   * Compress image before upload
   */
  static async compressImage(
    uri: string,
    maxWidth: number = 1920,
    quality: number = 0.8
  ): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: maxWidth } }],
        {
          compress: quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      return result.uri;
    } catch (error) {
      console.error('Error compressing image:', error);
      return uri;
    }
  }

  /**
   * Generate thumbnail
   */
  static async generateThumbnail(
    uri: string,
    size: number = 200
  ): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: size, height: size } }],
        {
          compress: 0.7,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );
      return result.uri;
    } catch (error) {
      console.error('Error generating thumbnail:', error);
      return uri;
    }
  }

  /**
   * Convert to WebP format (if supported)
   */
  static async convertToWebP(uri: string): Promise<string> {
    try {
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [],
        {
          compress: 0.8,
          format: ImageManipulator.SaveFormat.WEBP,
        }
      );
      return result.uri;
    } catch (error) {
      console.error('Error converting to WebP:', error);
      return uri;
    }
  }

  /**
   * Get image dimensions
   */
  static async getImageDimensions(uri: string): Promise<{ width: number; height: number }> {
    return new Promise((resolve, reject) => {
      Image.getSize(
        uri,
        (width, height) => resolve({ width, height }),
        (error) => reject(error)
      );
    });
  }

  /**
   * Get image file size
   */
  static async getImageSize(uri: string): Promise<number> {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      return fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;
    } catch (error) {
      console.error('Error getting image size:', error);
      return 0;
    }
  }
}

/**
 * Image Cache Service
 */
export class ImageCache {
  private static instance: ImageCache;
  private cache: Map<string, CacheEntry> = new Map();
  private initialized: boolean = false;

  static getInstance(): ImageCache {
    if (!ImageCache.instance) {
      ImageCache.instance = new ImageCache();
    }
    return ImageCache.instance;
  }

  /**
   * Initialize cache
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Create cache directory
      const dirInfo = await FileSystem.getInfoAsync(CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
      }

      // Load cache index
      await this.loadCacheIndex();

      // Clean expired entries
      await this.cleanExpiredEntries();

      this.initialized = true;
    } catch (error) {
      console.error('Error initializing image cache:', error);
    }
  }

  /**
   * Get cached image or download
   */
  async getCachedImage(url: string): Promise<string> {
    await this.initialize();

    // Check if already cached
    const cached = this.cache.get(url);
    if (cached) {
      // Check if file still exists
      const fileInfo = await FileSystem.getInfoAsync(cached.localUri);
      if (fileInfo.exists) {
        return cached.localUri;
      }
    }

    // Download and cache
    return await this.downloadAndCache(url);
  }

  /**
   * Download and cache image
   */
  private async downloadAndCache(url: string): Promise<string> {
    try {
      const filename = this.getFilenameFromUrl(url);
      const localUri = `${CACHE_DIR}${filename}`;

      // Download
      const downloadResult = await FileSystem.downloadAsync(url, localUri);

      if (downloadResult.status === 200) {
        const fileInfo = await FileSystem.getInfoAsync(localUri);
        const size = fileInfo.exists && 'size' in fileInfo ? fileInfo.size : 0;

        // Add to cache
        const entry: CacheEntry = {
          url,
          localUri,
          size,
          timestamp: Date.now(),
        };
        this.cache.set(url, entry);

        // Save cache index
        await this.saveCacheIndex();

        // Check cache size and clean if needed
        await this.ensureCacheSize();

        return localUri;
      }

      return url; // Return original URL if download failed
    } catch (error) {
      console.error('Error downloading image:', error);
      return url;
    }
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    try {
      await FileSystem.deleteAsync(CACHE_DIR, { idempotent: true });
      this.cache.clear();
      await this.saveCacheIndex();
      await this.initialize();
    } catch (error) {
      console.error('Error clearing cache:', error);
    }
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    let totalSize = 0;
    this.cache.forEach(entry => {
      totalSize += entry.size;
    });
    return totalSize;
  }

  /**
   * Load cache index from storage
   */
  private async loadCacheIndex(): Promise<void> {
    try {
      const indexStr = await AsyncStorage.getItem('imageCacheIndex');
      if (indexStr) {
        const entries: CacheEntry[] = JSON.parse(indexStr);
        entries.forEach(entry => {
          this.cache.set(entry.url, entry);
        });
      }
    } catch (error) {
      console.error('Error loading cache index:', error);
    }
  }

  /**
   * Save cache index to storage
   */
  private async saveCacheIndex(): Promise<void> {
    try {
      const entries = Array.from(this.cache.values());
      await AsyncStorage.setItem('imageCacheIndex', JSON.stringify(entries));
    } catch (error) {
      console.error('Error saving cache index:', error);
    }
  }

  /**
   * Clean expired entries
   */
  private async cleanExpiredEntries(): Promise<void> {
    const now = Date.now();
    const toDelete: string[] = [];

    this.cache.forEach((entry, url) => {
      if (now - entry.timestamp > CACHE_EXPIRY) {
        toDelete.push(url);
      }
    });

    for (const url of toDelete) {
      const entry = this.cache.get(url);
      if (entry) {
        await FileSystem.deleteAsync(entry.localUri, { idempotent: true });
        this.cache.delete(url);
      }
    }

    if (toDelete.length > 0) {
      await this.saveCacheIndex();
    }
  }

  /**
   * Ensure cache doesn't exceed max size
   */
  private async ensureCacheSize(): Promise<void> {
    const currentSize = this.getCacheSize();
    
    if (currentSize > MAX_CACHE_SIZE) {
      // Sort by timestamp (oldest first)
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp);

      // Delete oldest entries until under limit
      let deletedSize = 0;
      for (const [url, entry] of entries) {
        if (currentSize - deletedSize <= MAX_CACHE_SIZE * 0.8) break;

        await FileSystem.deleteAsync(entry.localUri, { idempotent: true });
        this.cache.delete(url);
        deletedSize += entry.size;
      }

      await this.saveCacheIndex();
    }
  }

  /**
   * Get filename from URL
   */
  private getFilenameFromUrl(url: string): string {
    const hash = this.simpleHash(url);
    const extension = url.split('.').pop()?.split('?')[0] || 'jpg';
    return `${hash}.${extension}`;
  }

  /**
   * Simple hash function
   */
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * Performance Monitoring
 */
export class PerformanceMonitor {
  private static metrics: PerformanceMetric[] = [];
  private static marks: Map<string, number> = new Map();

  /**
   * Start measuring operation
   */
  static startMeasure(name: string): void {
    this.marks.set(name, Date.now());
  }

  /**
   * End measuring operation
   */
  static endMeasure(name: string, metadata?: Record<string, any>): void {
    const startTime = this.marks.get(name);
    if (startTime) {
      const duration = Date.now() - startTime;
      this.metrics.push({
        name,
        duration,
        timestamp: Date.now(),
        metadata,
      });
      this.marks.delete(name);

      // Log slow operations
      if (duration > 1000) {
        console.warn(`Slow operation detected: ${name} took ${duration}ms`);
      }
    }
  }

  /**
   * Get performance metrics
   */
  static getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Clear metrics
   */
  static clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * Get average duration for operation
   */
  static getAverageDuration(name: string): number {
    const filtered = this.metrics.filter(m => m.name === name);
    if (filtered.length === 0) return 0;
    
    const total = filtered.reduce((sum, m) => sum + m.duration, 0);
    return total / filtered.length;
  }
}

/**
 * Custom Hooks for Performance
 */

/**
 * Debounce hook
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = React.useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Throttle hook
 */
export const useThrottle = <T>(value: T, limit: number): T => {
  const [throttledValue, setThrottledValue] = React.useState<T>(value);
  const lastRan = useRef(Date.now());

  useEffect(() => {
    const handler = setTimeout(() => {
      if (Date.now() - lastRan.current >= limit) {
        setThrottledValue(value);
        lastRan.current = Date.now();
      }
    }, limit - (Date.now() - lastRan.current));

    return () => {
      clearTimeout(handler);
    };
  }, [value, limit]);

  return throttledValue;
};

/**
 * Memoized callback with dependencies
 */
export const useMemoizedCallback = <T extends (...args: any[]) => any>(
  callback: T,
  deps: React.DependencyList
): T => {
  return useCallback(callback, deps);
};

/**
 * Memoized value with dependencies
 */
export const useMemoizedValue = <T>(
  factory: () => T,
  deps: React.DependencyList
): T => {
  return useMemo(factory, deps);
};

/**
 * Request deduplication
 */
export class RequestDeduplicator {
  private static pendingRequests: Map<string, Promise<any>> = new Map();

  /**
   * Execute request with deduplication
   */
  static async execute<T>(
    key: string,
    requestFn: () => Promise<T>
  ): Promise<T> {
    // Check if request is already in progress
    if (this.pendingRequests.has(key)) {
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Execute request
    const promise = requestFn()
      .finally(() => {
        // Remove from pending after completion
        this.pendingRequests.delete(key);
      });

    this.pendingRequests.set(key, promise);
    return promise;
  }

  /**
   * Clear all pending requests
   */
  static clear(): void {
    this.pendingRequests.clear();
  }
}

/**
 * Batch requests together
 */
export class RequestBatcher {
  private static batches: Map<string, any[]> = new Map();
  private static timers: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Add request to batch
   */
  static addToBatch(
    batchKey: string,
    request: any,
    executeFunc: (requests: any[]) => Promise<void>,
    delayMs: number = 50
  ): void {
    // Add to batch
    const batch = this.batches.get(batchKey) || [];
    batch.push(request);
    this.batches.set(batchKey, batch);

    // Clear existing timer
    const existingTimer = this.timers.get(batchKey);
    if (existingTimer) {
      clearTimeout(existingTimer);
    }

    // Set new timer
    const timer = setTimeout(async () => {
      const requests = this.batches.get(batchKey) || [];
      this.batches.delete(batchKey);
      this.timers.delete(batchKey);

      if (requests.length > 0) {
        await executeFunc(requests);
      }
    }, delayMs);

    this.timers.set(batchKey, timer);
  }
}

/**
 * Format file size for display
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
};

/**
 * Format duration for display
 */
export const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
};

export default {
  ImageOptimizer,
  ImageCache,
  PerformanceMonitor,
  RequestDeduplicator,
  RequestBatcher,
  formatFileSize,
  formatDuration,
};



