import { useState, useEffect, useCallback } from 'react';
import { instance } from '@/utils';
import { IApiResponse } from '@/utils/types';
import { AxiosError } from 'axios';

export const useGetPerformanceSheets = () => {
  const [sheets, setSheets] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const fetchSheets = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await instance.get<IApiResponse<any[]>>('/performance/sheets');

        if (data.success) {
          setSheets(data.data || []);
        } else {
          setError(data.error || 'Failed to fetch performance sheets');
        }
      } catch (error) {
        if (error instanceof AxiosError) {
          setError(error.response?.data.message);
        } else {
          setError('An error occurred. Please try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSheets();
  }, [refreshToggle]);

  const refresh = useCallback(() => setRefreshToggle(prev => !prev), []);

  return { sheets, loading, error, refresh };
};