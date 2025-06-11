import { AxiosError } from "axios";
import { useEffect, useState } from "react";

import { IApiResponse, IMachine, IQueryParams } from "@/utils/types";
import { instance } from "@/utils";

const useGetMachines = ({
  sort = "createdAt",
  order = "desc",
  page = 1,
  limit = 25,
  search,
  filter,
  dateFrom,
  dateTo,
}: IQueryParams = {}) => {
  const [machines, setMachines] = useState<IMachine[] | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshToggle, setRefreshToggle] = useState(false);
  const [pagination, setPagination] = useState<{
    total: number;
    totalPages: number;
    page: number;
    limit: number;
  }>({
    total: 0,
    totalPages: 0,
    page: 1,
    limit: 25,
  });

  useEffect(() => {
    const getMachines = async () => {
      setLoading(true);
      setError(null);

      try {
        const params: Record<
          string,
          string | number | boolean | Record<string, any> | Date
        > = {
          sort,
          order,
          page,
          limit,
        };

        if (search) params.search = search;
        if (filter) params.filter = filter;
        if (dateFrom) params.dateFrom = dateFrom;
        if (dateTo) params.dateTo = dateTo;

        const { data } = await instance.get<IApiResponse<IMachine[]>>(
          `/machines`,
          {
            params,
          }
        );

        if (data.success) {
          setMachines(data.data || []);
          setPagination({
            total: data.meta?.total || 0,
            totalPages: data.meta?.totalPages || 0,
            page: data.meta?.page || 1,
            limit: data.meta?.limit || 25,
          });
        } else {
          setError(data.error || "Failed to fetch employees");
        }
      } catch (error) {
        if (error instanceof AxiosError) {
          setError(error.response?.data.message);
        } else {
          setError("An error occurred. Please try again.");
        }
        return null;
      } finally {
        setLoading(false);
      }
    };

    getMachines();
  }, [
    refreshToggle,
    sort,
    order,
    page,
    limit,
    search,
    filter,
    dateFrom,
    dateTo,
  ]);

  const refresh = () => setRefreshToggle((prev) => !prev);

  return {
    machines,
    loading,
    error,
    refresh,
    pagination,
  };
};

export default useGetMachines;
