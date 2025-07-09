import { useState } from 'react';
import { pythonInstance } from '@/utils';
import { TDDBHDFormData, VersionKey, VersionedSection } from './use-create-tddbhd';

export const useGetTDDBHD = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [fetchedTDDBHD, setFetchedTDDBHD] = useState<TDDBHDFormData | null>(null);

  const getTDDBHD = async (referenceNumber: string) => {
    if (!referenceNumber) {
      setStatus("Please enter a reference number");
      return;
    }
    setIsLoading(true);
    try {
      const response = await pythonInstance.get(`/tddbhd/${referenceNumber}`);
      setFetchedTDDBHD(response.data);
      setStatus("TD/DB/HD report fetched successfully!");
      return response.data;
    } catch (error: any) {
      console.error('Error fetching TD/DB/HD report:', error);
      if (error.response?.data) {
        setStatus(`Failed to fetch TD/DB/HD report: ${JSON.stringify(error.response.data)}`);
      } else {
        setStatus("Failed to fetch TD/DB/HD report. Please try again.");
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearTDDBHD = () => {
    setFetchedTDDBHD(null);
    setStatus("");
  };

  return {
    isLoading,
    status,
    fetchedTDDBHD,
    getTDDBHD,
    clearTDDBHD
  };
}; 