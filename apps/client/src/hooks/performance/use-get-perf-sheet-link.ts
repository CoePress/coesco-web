import { useGetEntity } from '@/hooks/_base/use-get-entity';

export const useGetPerformanceSheetLink = (id?: string) => {
  return useGetEntity<any>('/performance/links', id);
};