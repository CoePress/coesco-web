import { useState, useCallback } from 'react';
import { instance } from '@/utils';
import { IApiResponse } from '@/utils/types';
import { AxiosError } from 'axios';
import { PerformanceData } from '@/contexts/performance.context';

export const useUpdatePerformanceSheet = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const updateSheet = useCallback(async (id: string, data: Partial<PerformanceData>) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      console.log("Updating Performance Sheet with ID:", id, "Data:", data);

      const response = await instance.patch<IApiResponse<PerformanceData>>(
        `/performance/sheets/${id}`, {data}
      );

      console.log("Update Response:", response.data);

      if (response.data.success) {
        return response.data;
      } else {
        setError(response.data.error || 'Failed to update performance sheet');
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
      setSuccess(false);
    }
  }, []);

  return { updateSheet, loading, error, success };
};