/**
 * Custom Hook for Service Results
 * Provides optimistic UI updates and real-time sync
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import ServiceResultsAPI, { ServiceResult, ServiceType } from '../services/ServiceResultsAPI';
import WebSocketService from '../services/WebSocketService';

interface UseServiceResultsOptions {
  serviceType?: ServiceType;
  limit?: number;
  enableRealtime?: boolean;
}

export function useServiceResults(options: UseServiceResultsOptions = {}) {
  const [results, setResults] = useState<ServiceResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const optimisticUpdates = useRef<Map<string, ServiceResult>>(new Map());

  // Load results
  const loadResults = useCallback(async () => {
    try {
      setError(null);
      const data = await ServiceResultsAPI.getUserResults({
        serviceType: options.serviceType,
        limit: options.limit || 50,
      });
      setResults(data);
    } catch (err) {
      setError(err as Error);
      console.error('Error loading results:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [options.serviceType, options.limit]);

  // Initial load
  useEffect(() => {
    loadResults();
  }, [loadResults]);

  // Setup real-time updates
  useEffect(() => {
    if (!options.enableRealtime) return;

    const unsubscribeSaved = WebSocketService.on('service_result_saved', (result) => {
      // Add new result to the list
      setResults((prev) => [result, ...prev]);
    });

    const unsubscribeDeleted = WebSocketService.on('result_deleted', (resultId) => {
      // Remove deleted result
      setResults((prev) => prev.filter((r) => r.id !== resultId));
    });

    return () => {
      unsubscribeSaved();
      unsubscribeDeleted();
    };
  }, [options.enableRealtime]);

  // Save result with optimistic update
  const saveResult = useCallback(
    async (data: {
      serviceType: ServiceType;
      resultData: any;
      conversationId?: string;
    }) => {
      // Create optimistic result
      const optimisticResult: ServiceResult = {
        id: `temp-${Date.now()}`,
        userId: 'current-user',
        serviceType: data.serviceType,
        resultData: data.resultData,
        summary: 'Generating summary...',
        createdAt: new Date(),
        conversationId: data.conversationId,
      };

      // Add optimistic result
      optimisticUpdates.current.set(optimisticResult.id, optimisticResult);
      setResults((prev) => [optimisticResult, ...prev]);

      try {
        // Save to server
        const savedResult = await ServiceResultsAPI.saveResult(data);

        // Replace optimistic with real result
        optimisticUpdates.current.delete(optimisticResult.id);
        setResults((prev) =>
          prev.map((r) => (r.id === optimisticResult.id ? savedResult : r))
        );

        return savedResult;
      } catch (err) {
        // Rollback on error
        optimisticUpdates.current.delete(optimisticResult.id);
        setResults((prev) => prev.filter((r) => r.id !== optimisticResult.id));
        throw err;
      }
    },
    []
  );

  // Delete result with optimistic update
  const deleteResult = useCallback(async (resultId: string) => {
    // Optimistically remove
    const removedResult = results.find((r) => r.id === resultId);
    if (!removedResult) return;

    setResults((prev) => prev.filter((r) => r.id !== resultId));

    try {
      await ServiceResultsAPI.deleteResult(resultId);
    } catch (err) {
      // Rollback on error
      setResults((prev) => [removedResult, ...prev]);
      throw err;
    }
  }, [results]);

  // Refresh results
  const refresh = useCallback(async () => {
    setRefreshing(true);
    await loadResults();
  }, [loadResults]);

  return {
    results,
    loading,
    error,
    refreshing,
    saveResult,
    deleteResult,
    refresh,
  };
}

export default useServiceResults;

