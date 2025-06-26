import { useState } from 'react';
import { pythonInstance } from '@/utils';
import { RFQFormData } from './use-create-rfq';

export const useGetRFQ = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [fetchedRFQ, setFetchedRFQ] = useState<RFQFormData | null>(null);

  const getRFQ = async (referenceNumber: string) => {
    if (!referenceNumber) {
      setStatus("Please enter a reference number");
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await pythonInstance.get(`/rfq/${referenceNumber}`);
      
      setFetchedRFQ(response.data);
      setStatus("RFQ fetched successfully!");
      return response.data;
    } catch (error: any) {
      console.error('Error fetching RFQ:', error);
      if (error.response?.data) {
        setStatus(`Failed to fetch RFQ: ${JSON.stringify(error.response.data)}`);
      } else {
        setStatus("Failed to fetch RFQ. Please try again.");
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const clearRFQ = () => {
    setFetchedRFQ(null);
    setStatus("");
  };

  return {
    isLoading,
    status,
    fetchedRFQ,
    getRFQ,
    clearRFQ
  };
}; 