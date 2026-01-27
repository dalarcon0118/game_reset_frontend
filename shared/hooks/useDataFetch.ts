import { useState, useEffect, useRef, useCallback } from 'react';
import { ApiClientError } from '@/shared/services/ApiClient';

type FetchFunction<T, P extends any[]> = (...args: P) => Promise<T>;

interface DataFetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | ApiClientError | null;
}

export function useDataFetch<T, P extends any[] = []>(
  fetchFn: FetchFunction<T, P> | Promise<T>
) {
  // Separate states
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | ApiClientError | null>(null);
  // Version key to force updates even if data looks the same
  const [versionKey, setVersionKey] = useState(0);

  // Refs
  const fetcherRef = useRef(fetchFn);
  const isMounted = useRef(true);

  // Update fetcher reference
  useEffect(() => {
    fetcherRef.current = fetchFn;
  }, [fetchFn]);

  // Component mount tracking
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Data change handler


  // State handlers
  const handleSetLoading = useCallback((loading: boolean) => {
    if (isMounted.current) {
      setIsLoading(loading);
    }
  }, []);

  const handleSetData = useCallback((newData: T | null) => {
       if (isMounted.current) {
      setData(newData);
      // Increment version when we get new data (not null)
      if (newData !== null) {
        console.log('Incrementing version key for non-null data');
        setVersionKey(prev => prev + 1);
      } else {
        console.log('Data is null, not incrementing version key');
      }
    }
  }, []);

  const handleSetError = useCallback((newError: Error | ApiClientError | null) => {
    if (isMounted.current) {
      setError(newError);
    }
  }, []);

  // Main fetch handler
  const executeFetch = useCallback(async (...args: P): Promise<T | any> => {
    try {
      handleSetLoading(true);
      handleSetError(null);
      handleSetData(null); // Reset data at the start of each fetch

      const currentFetcher = fetcherRef.current;
      const result = currentFetcher instanceof Promise
        ? await currentFetcher
        : await currentFetcher(...args);
    
      handleSetData(result);
      handleSetLoading(false);

      return result;
    } catch (error) {
      console.error('Error caught in useDataFetch:', error);
      handleSetData(null);
      handleSetLoading(false);
      // Preserve ApiClientError to maintain status code and error details
      if (error instanceof ApiClientError) {
        handleSetError(error);
      } else {
        handleSetError(error instanceof Error ? error : new Error('An error occurred'));
      }
    }
  }, [handleSetData, handleSetLoading, handleSetError]); // Removed fetchFn from dependencies

  return [executeFetch, data, isLoading, error, versionKey] as const;
}

export default useDataFetch;