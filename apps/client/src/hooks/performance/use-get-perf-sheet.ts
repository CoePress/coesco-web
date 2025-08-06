import { PerformanceData } from '@/contexts/performance.context';
import { useGetEntity } from '@/hooks/_base/use-get-entity';

export const useGetPerformanceSheet = (id?: string) => {
  return useGetEntity<PerformanceData>('/performance/sheets', id);
};