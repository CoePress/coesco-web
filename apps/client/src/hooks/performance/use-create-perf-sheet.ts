import { useState, useCallback } from 'react';
import { instance } from '@/utils';
import { IApiResponse } from '@/utils/types';
import { AxiosError } from 'axios';
import { PerformanceData } from '@/contexts/performance.context';

export const useCreatePerformanceSheet = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const createSheet = useCallback(async (data: Partial<PerformanceData>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await instance.post<IApiResponse<PerformanceData>>('/performance/sheets', data);

      if (response.data.success) {
        return response.data.data;
      } else {
        setError(response.data.error || 'Failed to create performance sheet');
        return null;
      }
    } catch (error) {
      if (error instanceof AxiosError) {
        setError(error.response?.data.message);
      } else {
        setError('An error occurred. Please try again.');
      }
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { createSheet, loading, error };
};