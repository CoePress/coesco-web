import { useState, useEffect, useCallback } from 'react';
import { instance } from '@/utils';
import { IApiResponse } from '@/utils/types';
import { AxiosError } from 'axios';

export const useGetPerformanceSheetVersions = () => {
  const [versions, setVersions] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);

  useEffect(() => {
    const fetchVersions = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data } = await instance.get<IApiResponse<any[]>>('/performance/versions');

        if (data.success) {
          setVersions(data.data || []);
        } else {
          setError(data.error || 'Failed to fetch performance sheet versions');
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

    fetchVersions();
  }, [refreshToggle]);

  const refresh = useCallback(() => setRefreshToggle(prev => !prev), []);

  return { versions, loading, error, refresh };
};