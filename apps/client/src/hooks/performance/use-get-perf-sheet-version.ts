import { useGetEntity } from '@/hooks/_base/use-get-entity';

export const useGetPerformanceSheetVersion = (id?: string) => {
  return useGetEntity<any>('/performance/versions', id);
};