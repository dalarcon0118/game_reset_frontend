import { useState, useEffect, useRef, useCallback } from 'react';

type FetchFunction<T, P extends any[]> = (...args: P) => Promise<T>;

interface DataFetchState<T> {
  data: T | null;
  isLoading: boolean;
  error: Error | null;
}

export function useDataFetch<T, P extends any[] = []>(
  fetchFn: FetchFunction<T, P> | Promise<T>
) {
  // Separate states
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

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
    }
  }, []);

  const handleSetError = useCallback((newError: Error | null) => {
    if (isMounted.current) {
      setError(newError);
    }
  }, []);

  // Main fetch handler
  const executeFetch = useCallback(async (...args: P): Promise<T | any> => {
    try {
      handleSetLoading(true);
      handleSetError(null);
      
      const result = fetchFn instanceof Promise
        ? await fetchFn
        : await fetchFn(...args);
      
      handleSetData(result);
      handleSetLoading(false);
      
      return result;
    } catch (error) {
      handleSetData(null);
      handleSetLoading(false);
      handleSetError(error instanceof Error ? error : new Error('An error occurred'));
    }
  }, [fetchFn, handleSetData, handleSetLoading, handleSetError]);

  return [executeFetch, data, isLoading, error] as const;
}

export default useDataFetch;